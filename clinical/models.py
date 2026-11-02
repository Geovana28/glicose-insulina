from django.db import models

class Patient(models.Model):
    name = models.CharField(max_length=120)
    age = models.IntegerField(default=40)
    phenotype = models.CharField(max_length=50, default='Healthy')
    fasting_glucose = models.FloatField(default=90.0) # mg/dL
    fasting_insulin = models.FloatField(default=10.0) # uU/mL
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.phenotype})"

class OGTTExam(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='exams')
    carbs_grams = models.FloatField(default=75.0)
    peak_glucose = models.FloatField()
    glucose_120min = models.FloatField()
    disposition_index = models.FloatField()
    diagnosis = models.CharField(max_length=80)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"OGTT {self.patient.name} - {self.diagnosis}"
