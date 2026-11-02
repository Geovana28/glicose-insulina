import json
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Patient, OGTTExam

def simulator_view(request):
    return render(request, 'index.html')

@csrf_exempt
def api_patients(request):
    if request.method == 'POST':
        data = json.loads(request.body or '{}')
        p = Patient.objects.create(
            name=data.get('name', 'Patient Anon'),
            age=data.get('age', 40),
            phenotype=data.get('phenotype', 'Healthy'),
            fasting_glucose=data.get('fasting_g', 90.0),
            fasting_insulin=data.get('fasting_i', 10.0)
        )
        return JsonResponse({"status": "created", "id": p.id, "name": p.name})

    patients = list(Patient.objects.values())
    return JsonResponse(patients, safe=False)

@csrf_exempt
def api_save_exam(request):
    if request.method == 'POST':
        data = json.loads(request.body or '{}')
        patient_id = data.get('patient_id')
        try:
            patient = Patient.objects.get(id=patient_id) if patient_id else Patient.objects.first()
            if not patient:
                patient = Patient.objects.create(name="Default Patient")
        except Patient.DoesNotExist:
            patient = Patient.objects.create(name="Default Patient")

        exam = OGTTExam.objects.create(
            patient=patient,
            carbs_grams=data.get('carbs', 75.0),
            peak_glucose=data.get('peak_g', 140.0),
            glucose_120min=data.get('g120', 100.0),
            disposition_index=data.get('di', 2.5),
            diagnosis=data.get('diagnosis', 'Normal')
        )
        return JsonResponse({"status": "saved", "exam_id": exam.id})
    return JsonResponse({"error": "POST required"}, status=405)
