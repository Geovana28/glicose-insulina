/* ============================================================
   BERGMAN MINIMAL MODEL — ODE ENGINE
   dG/dt = -(p1 + X)*G + p1*Gb + Ra(t)
   dX/dt = -p2*X + p3*(I - Ib)
   dI/dt = -n*(I - Ib) + gamma*(G - h)+ * t
   ============================================================ */

(() => {
    'use strict';

    // Phenotype profiles
    const PHENOTYPES = {
        healthy: {
            name: 'Healthy Subject',
            carbs: 75,
            ka: 0.05,
            p3: 5.0,     // Si * p2 ~ 5.0e-4
            gamma: 0.005, // prompt pancreatic response
            p1: 0.028,
            Gb: 90
        },
        prediabetes: {
            name: 'Pre-Diabetic',
            carbs: 75,
            ka: 0.05,
            p3: 2.2,     // lower insulin sensitivity
            gamma: 0.008, // compensatory hyperinsulinemia
            p1: 0.020,
            Gb: 108
        },
        t2d: {
            name: 'Type 2 Diabetes',
            carbs: 75,
            ka: 0.05,
            p3: 1.0,     // severe insulin resistance
            gamma: 0.002, // beta-cell failure / exhausted
            p1: 0.015,
            Gb: 135
        },
        t1d: {
            name: 'Type 1 Diabetes (No Insulin)',
            carbs: 75,
            ka: 0.05,
            p3: 5.0,     // sensitive to insulin if injected
            gamma: 0.000, // zero endogenous insulin production
            p1: 0.025,
            Gb: 120
        },
        athlete: {
            name: 'Endurance Athlete',
            carbs: 75,
            ka: 0.05,
            p3: 10.0,    // very high peripheral insulin sensitivity
            gamma: 0.004,
            p1: 0.035,
            Gb: 82
        }
    };

    // DOM Controls
    const carbsSlider = document.getElementById('carbsAmount');
    const carbsVal = document.getElementById('carbsAmountVal');
    const absSlider = document.getElementById('absorptionRate');
    const absVal = document.getElementById('absorptionRateVal');

    const p3Slider = document.getElementById('sensP3');
    const p3Val = document.getElementById('sensP3Val');
    const gammaSlider = document.getElementById('pancreasGamma');
    const gammaVal = document.getElementById('pancreasGammaVal');
    const p1Slider = document.getElementById('glucoseEffectiveness');
    const p1Val = document.getElementById('glucoseEffectivenessVal');
    const gbSlider = document.getElementById('fastingG');
    const gbVal = document.getElementById('fastingGVal');

    const profileBtns = document.querySelectorAll('.btn-profile');

    const glycemicBanner = document.getElementById('glycemicBanner');
    const bannerIcon = document.getElementById('bannerIcon');
    const bannerTitle = document.getElementById('bannerTitle');
    const bannerDesc = document.getElementById('bannerDesc');

    const peakG = document.getElementById('peakG');
    const peakGTime = document.getElementById('peakGTime');
    const g120 = document.getElementById('g120');
    const g120Status = document.getElementById('g120Status');
    const peakI = document.getElementById('peakI');
    const dispositionIndex = document.getElementById('dispositionIndex');
    const diStatus = document.getElementById('diStatus');

    let gChart = null;
    let iChart = null;

    function initCharts() {
        const ctxG = document.getElementById('glucoseChart').getContext('2d');
        gChart = new Chart(ctxG, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Glucose G(t) [mg/dL]',
                    data: [],
                    borderColor: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    borderWidth: 2.5,
                    pointRadius: 0,
                    tension: 0.25,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: { display: true, text: 'Time (minutes)', color: '#94a3b8' },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#64748b' }
                    },
                    y: {
                        beginAtZero: false,
                        title: { display: true, text: 'mg/dL', color: '#94a3b8' },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#64748b' }
                    }
                }
            }
        });

        const ctxI = document.getElementById('insulinChart').getContext('2d');
        iChart = new Chart(ctxI, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Insulin I(t) [µU/mL]',
                    data: [],
                    borderColor: '#c084fc',
                    backgroundColor: 'rgba(192, 132, 252, 0.1)',
                    borderWidth: 2.5,
                    pointRadius: 0,
                    tension: 0.25,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: { display: true, text: 'Time (minutes)', color: '#94a3b8' },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#64748b' }
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'µU/mL', color: '#94a3b8' },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#64748b' }
                    }
                }
            }
        });
    }

    function simulate() {
        const carbs = parseFloat(carbsSlider.value);
        const ka = parseFloat(absSlider.value);
        const p3Raw = parseFloat(p3Slider.value);
        const p3 = p3Raw * 1e-4;
        const gamma = parseFloat(gammaSlider.value);
        const p1 = parseFloat(p1Slider.value);
        const Gb = parseFloat(gbSlider.value);
        const Ib = 10.0; // Basal fasting insulin (µU/mL)
        const p2 = 0.025; // Remote insulin compartment clearance rate
        const n = 0.15;  // Insulin degradation rate (/min)
        const h = Gb;    // Threshold level for pancreatic glucose stimulation

        // UI Displays
        carbsVal.textContent = `${carbs} g`;
        absVal.textContent = `${ka.toFixed(2)} /min`;
        p3Val.textContent = `${p3Raw.toFixed(1)} ×10⁻⁴`;
        gammaVal.textContent = gamma.toFixed(3);
        p1Val.textContent = `${p1.toFixed(3)} /min`;
        gbVal.textContent = `${Math.round(Gb)} mg/dL`;

        // Bergman Model Integration (Euler / RK4)
        const totalMinutes = 240;
        const dt = 0.5; // step in minutes
        const steps = Math.round(totalMinutes / dt);

        let G = Gb;
        let X = 0.0; // remote insulin action
        let I = Ib;

        const labels = [];
        const gData = [];
        const iData = [];

        let maxG = 0;
        let timeOfMaxG = 0;
        let maxI = 0;
        let gAt120 = Gb;

        for (let s = 0; s <= steps; s++) {
            const t = s * dt;

            // Meal absorption rate Ra(t): Oral glucose bolus enters gut and clears into blood
            // Ra(t) = A * t * exp(-ka * t)
            const conversionFactor = 2.8; // converts grams of carbs into plasma mg/dL rate
            const Ra = carbs * conversionFactor * ka * ka * t * Math.exp(-ka * t);

            // ODEs
            const dG = -(p1 + X) * G + p1 * Gb + Ra;
            const dX = -p2 * X + p3 * (I - Ib);
            const stim = Math.max(0, G - h);
            const dI = -n * (I - Ib) + gamma * stim * t;

            G += dG * dt;
            X += dX * dt;
            I += dI * dt;

            // Biological floor
            G = Math.max(30, G);
            I = Math.max(0, I);
            X = Math.max(0, X);

            if (G > maxG) {
                maxG = G;
                timeOfMaxG = t;
            }
            if (I > maxI) {
                maxI = I;
            }
            if (Math.abs(t - 120) < dt) {
                gAt120 = G;
            }

            if (s % 4 === 0) { // every 2 mins
                labels.push(`${Math.round(t)}m`);
                gData.push(G.toFixed(1));
                iData.push(I.toFixed(1));
            }
        }

        // Metrics
        peakG.innerHTML = `${Math.round(maxG)} <span class="metric-unit">mg/dL</span>`;
        peakGTime.textContent = `Peak at ${Math.round(timeOfMaxG)} min`;
        g120.innerHTML = `${Math.round(gAt120)} <span class="metric-unit">mg/dL</span>`;
        peakI.innerHTML = `${maxI.toFixed(1)} <span class="metric-unit">µU/mL</span>`;

        // Disposition Index: DI = Insulin Sensitivity * Beta Cell Response
        const di = (p3Raw * gamma * 100).toFixed(2);
        dispositionIndex.textContent = di;

        // Clinical Evaluation
        if (gAt120 < 140 && maxG < 180) {
            glycemicBanner.className = 'condition-banner normal';
            bannerIcon.textContent = '🟢';
            bannerTitle.textContent = 'Normal Glycemic Response';
            bannerDesc.textContent = `Postprandial glucose rapidly clears to < 140 mg/dL by minute 120. Robust beta-cell compensation.`;
            g120Status.textContent = 'Normal (< 140 mg/dL)';
            g120Status.className = 'metric-footer';
            diStatus.textContent = 'Optimal compensation';
            diStatus.className = 'metric-footer';
        } else if (gAt120 >= 140 && gAt120 < 200) {
            glycemicBanner.className = 'condition-banner warning';
            bannerIcon.textContent = '🟡';
            bannerTitle.textContent = 'Impaired Glucose Tolerance (Pre-diabetes)';
            bannerDesc.textContent = `2-hour postprandial glucose between 140 - 199 mg/dL. Peripheral tissue resistance observed.`;
            g120Status.textContent = 'Elevated (140-199 mg/dL)';
            g120Status.className = 'metric-footer warn';
            diStatus.textContent = 'Sub-optimal disposition';
            diStatus.className = 'metric-footer warn';
        } else {
            glycemicBanner.className = 'condition-banner danger';
            bannerIcon.textContent = '🔴';
            bannerTitle.textContent = 'Diabetic Glycemic Pattern';
            bannerDesc.textContent = `Severe hyperglycemia! 2-hour glucose > 200 mg/dL or excessive peak. Insufficient insulin action to clear glucose.`;
            g120Status.textContent = 'Diabetic (≥ 200 mg/dL)';
            g120Status.className = 'metric-footer warn';
            diStatus.textContent = 'Beta-cell exhaustion';
            diStatus.className = 'metric-footer warn';
        }

        // Update Charts
        gChart.data.labels = labels;
        gChart.data.datasets[0].data = gData;
        gChart.update();

        iChart.data.labels = labels;
        iChart.data.datasets[0].data = iData;
        iChart.update();
    }

    function applyProfile(key) {
        const p = PHENOTYPES[key];
        if (!p) return;

        carbsSlider.value = p.carbs;
        absSlider.value = p.ka;
        p3Slider.value = p.p3;
        gammaSlider.value = p.gamma;
        p1Slider.value = p.p1;
        gbSlider.value = p.Gb;

        simulate();
    }

    const inputs = [carbsSlider, absSlider, p3Slider, gammaSlider, p1Slider, gbSlider];
    inputs.forEach(i => i.addEventListener('input', simulate));

    profileBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            profileBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyProfile(btn.dataset.profile);
        });
    });

    initCharts();
    applyProfile('healthy');
})();
