import firebase_admin
from firebase_admin import credentials, firestore

#Path de las credenciales
FIREBASE_CRED_PATH = "c:\Users\Dell\OneDrive - Instituto Tecnologico y de Estudios Superiores de Monterrey\Desktop\Padel_coreV1\Credenciales\padel-corev1-firebase-adminsdk-u2tz6-97f6e851d4.json"

if not firebase_admin._apps:
    cred = credentials.Certificate(FIREBASE_CRED_PATH)
    firebase_admin.initialize_app(cred)

db_firebase = firestore.client()