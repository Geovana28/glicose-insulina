"""
URL configuration for metabolic_core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from clinical.views import simulator_view, api_patients, api_save_exam

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', simulator_view, name='home'),
    path('api/patients/', api_patients, name='api_patients'),
    path('api/save-exam/', api_save_exam, name='api_save_exam'),
]
