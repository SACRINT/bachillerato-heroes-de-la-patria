"""
📦 BGE SDK - Python Client
Cliente para API v2 de BGE en Python

Instalación:
    pip install requests

Uso:
    from bge_sdk import BGEClient

    client = BGEClient(api_url='https://api.bge.edu.mx', api_key='your-key')
    client.auth.login('email@example.com', 'password')
    students = client.students.list()

Versión: 1.0.0
Fecha: 17 Noviembre 2025
"""

import requests
import time
from typing import Dict, List, Optional, Any
from urllib.parse import urlencode


class BGEError(Exception):
    """Excepción personalizada para errores de la API BGE"""

    def __init__(self, code: str, message: str, status: int, data: Dict = None):
        self.code = code
        self.message = message
        self.status = status
        self.data = data or {}
        super().__init__(self.message)

    def __str__(self):
        return f"BGEError({self.code}): {self.message} (HTTP {self.status})"


class BGEClient:
    """Cliente principal para la API de BGE"""

    def __init__(
        self,
        api_url: str = 'http://localhost:3000',
        api_key: Optional[str] = None,
        api_version: str = 'v2',
        tenant_id: Optional[str] = None,
        max_retries: int = 3
    ):
        """
        Inicializa el cliente BGE

        Args:
            api_url: Base URL de la API
            api_key: API Key (opcional si se usa JWT)
            api_version: Versión de API ('v1' o 'v2')
            tenant_id: ID del tenant (opcional)
            max_retries: Número máximo de reintentos
        """
        self.api_url = api_url.rstrip('/')
        self.api_key = api_key
        self.api_version = api_version
        self.tenant_id = tenant_id
        self.token = None
        self.max_retries = max_retries

        # Módulos del SDK
        self.auth = AuthModule(self)
        self.students = StudentsModule(self)
        self.teachers = TeachersModule(self)
        self.grades = GradesModule(self)
        self.news = NewsModule(self)
        self.webhooks = WebhooksModule(self)
        self.reports = ReportsModule(self)
        self.search = SearchModule(self)

    def request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None,
        headers: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Realiza una petición HTTP a la API con retry automático

        Args:
            method: Método HTTP (GET, POST, PUT, DELETE, PATCH)
            endpoint: Endpoint de la API (ej: '/students')
            data: Datos para el body (POST/PUT/PATCH)
            params: Query parameters (GET)
            headers: Headers adicionales

        Returns:
            Respuesta JSON de la API

        Raises:
            BGEError: Si la petición falla
        """
        url = f"{self.api_url}/api/{self.api_version}{endpoint}"

        # Headers base
        request_headers = {
            'Content-Type': 'application/json',
            'Accept-Version': self.api_version,
            'User-Agent': 'BGE-SDK-Python/1.0.0'
        }

        # Autenticación
        if self.token:
            request_headers['Authorization'] = f'Bearer {self.token}'
        elif self.api_key:
            request_headers['X-API-Key'] = self.api_key

        # Tenant ID
        if self.tenant_id:
            request_headers['X-Tenant-ID'] = self.tenant_id

        # Merge headers adicionales
        if headers:
            request_headers.update(headers)

        # Retry logic con exponential backoff
        last_error = None
        for attempt in range(self.max_retries + 1):
            try:
                response = requests.request(
                    method=method,
                    url=url,
                    json=data,
                    params=params,
                    headers=request_headers,
                    timeout=30
                )

                # Warning deprecation
                if response.headers.get('X-API-Deprecation-Warning'):
                    import warnings
                    warnings.warn(
                        f"⚠️ API {self.api_version} está deprecada. "
                        f"End of Life: {response.headers.get('X-API-End-Of-Life')}",
                        DeprecationWarning
                    )

                # Parse JSON
                try:
                    response_data = response.json()
                except ValueError:
                    response_data = {'error': 'INVALID_JSON', 'message': response.text}

                # Check status
                if not response.ok:
                    raise BGEError(
                        code=response_data.get('error', 'API_ERROR'),
                        message=response_data.get('message', 'Error desconocido'),
                        status=response.status_code,
                        data=response_data
                    )

                return response_data

            except requests.exceptions.RequestException as e:
                last_error = BGEError(
                    code='NETWORK_ERROR',
                    message=str(e),
                    status=0,
                    data={}
                )

                # No retry para errores 4xx (client errors)
                if hasattr(e, 'response') and e.response and 400 <= e.response.status_code < 500:
                    raise last_error

                # Exponential backoff
                if attempt < self.max_retries:
                    delay = 2 ** attempt  # 1s, 2s, 4s
                    print(f"Retry {attempt + 1}/{self.max_retries} después de {delay}s...")
                    time.sleep(delay)

            except BGEError as e:
                # No retry para errores de cliente
                if 400 <= e.status < 500:
                    raise
                last_error = e

                if attempt < self.max_retries:
                    delay = 2 ** attempt
                    print(f"Retry {attempt + 1}/{self.max_retries} después de {delay}s...")
                    time.sleep(delay)

        # Si llegamos aquí, todos los reintentos fallaron
        raise last_error

    def set_token(self, token: str):
        """Establece el token JWT"""
        self.token = token

    def clear_token(self):
        """Limpia el token"""
        self.token = None


# =============================================================================
# MÓDULOS DEL SDK
# =============================================================================

class AuthModule:
    """Módulo de autenticación"""

    def __init__(self, client: BGEClient):
        self.client = client

    def login(self, email: str, password: str) -> Dict:
        """Iniciar sesión con email y contraseña"""
        data = self.client.request('POST', '/auth/login', data={
            'email': email,
            'password': password
        })
        if data.get('token'):
            self.client.set_token(data['token'])
        return data

    def logout(self) -> Dict:
        """Cerrar sesión"""
        self.client.clear_token()
        return {'success': True}

    def get_profile(self) -> Dict:
        """Obtener perfil del usuario autenticado"""
        return self.client.request('GET', '/auth/profile')

    def change_password(self, current_password: str, new_password: str) -> Dict:
        """Cambiar contraseña"""
        return self.client.request('POST', '/auth/change-password', data={
            'currentPassword': current_password,
            'newPassword': new_password
        })


class StudentsModule:
    """Módulo de estudiantes"""

    def __init__(self, client: BGEClient):
        self.client = client

    def list(self, **params) -> Dict:
        """Listar estudiantes con filtros opcionales"""
        return self.client.request('GET', '/students', params=params)

    def get(self, student_id: int) -> Dict:
        """Obtener un estudiante por ID"""
        return self.client.request('GET', f'/students/{student_id}')

    def create(self, student_data: Dict) -> Dict:
        """Crear un nuevo estudiante"""
        return self.client.request('POST', '/students', data=student_data)

    def update(self, student_id: int, student_data: Dict) -> Dict:
        """Actualizar un estudiante"""
        return self.client.request('PUT', f'/students/{student_id}', data=student_data)

    def delete(self, student_id: int) -> Dict:
        """Eliminar un estudiante"""
        return self.client.request('DELETE', f'/students/{student_id}')

    def get_grades(self, student_id: int) -> Dict:
        """Obtener calificaciones de un estudiante"""
        return self.client.request('GET', f'/students/{student_id}/grades')


class TeachersModule:
    """Módulo de docentes"""

    def __init__(self, client: BGEClient):
        self.client = client

    def list(self, **params) -> Dict:
        """Listar docentes"""
        return self.client.request('GET', '/teachers', params=params)

    def get(self, teacher_id: int) -> Dict:
        """Obtener un docente por ID"""
        return self.client.request('GET', f'/teachers/{teacher_id}')


class GradesModule:
    """Módulo de calificaciones"""

    def __init__(self, client: BGEClient):
        self.client = client

    def create(self, student_id: int, grade_data: Dict) -> Dict:
        """Crear calificación para un estudiante"""
        return self.client.request('POST', f'/students/{student_id}/grades', data=grade_data)

    def update(self, grade_id: int, grade_data: Dict) -> Dict:
        """Actualizar una calificación"""
        return self.client.request('PUT', f'/grades/{grade_id}', data=grade_data)

    def delete(self, grade_id: int) -> Dict:
        """Eliminar una calificación"""
        return self.client.request('DELETE', f'/grades/{grade_id}')


class NewsModule:
    """Módulo de noticias"""

    def __init__(self, client: BGEClient):
        self.client = client

    def list(self, **params) -> Dict:
        """Listar noticias"""
        return self.client.request('GET', '/news', params=params)

    def get(self, news_id: int) -> Dict:
        """Obtener una noticia por ID"""
        return self.client.request('GET', f'/news/{news_id}')

    def create(self, news_data: Dict) -> Dict:
        """Crear una noticia"""
        return self.client.request('POST', '/news', data=news_data)

    def update(self, news_id: int, news_data: Dict) -> Dict:
        """Actualizar una noticia"""
        return self.client.request('PUT', f'/news/{news_id}', data=news_data)

    def publish(self, news_id: int) -> Dict:
        """Publicar una noticia"""
        return self.client.request('POST', f'/news/{news_id}/publish')


class WebhooksModule:
    """Módulo de webhooks"""

    def __init__(self, client: BGEClient):
        self.client = client

    def list(self) -> Dict:
        """Listar webhooks"""
        return self.client.request('GET', '/webhooks')

    def create(self, webhook_data: Dict) -> Dict:
        """Crear un webhook"""
        return self.client.request('POST', '/webhooks', data=webhook_data)

    def update(self, webhook_id: int, webhook_data: Dict) -> Dict:
        """Actualizar un webhook"""
        return self.client.request('PATCH', f'/webhooks/{webhook_id}', data=webhook_data)

    def delete(self, webhook_id: int) -> Dict:
        """Eliminar un webhook"""
        return self.client.request('DELETE', f'/webhooks/{webhook_id}')

    def test(self, webhook_id: int) -> Dict:
        """Enviar evento de prueba a un webhook"""
        return self.client.request('POST', f'/webhooks/{webhook_id}/test')

    def get_deliveries(self, webhook_id: int, **params) -> Dict:
        """Obtener historial de deliveries de un webhook"""
        return self.client.request('GET', f'/webhooks/{webhook_id}/deliveries', params=params)


class ReportsModule:
    """Módulo de reportes"""

    def __init__(self, client: BGEClient):
        self.client = client

    def students(self, **params) -> Dict:
        """Generar reporte de estudiantes"""
        return self.client.request('GET', '/reports/students', params=params)

    def financial(self, **params) -> Dict:
        """Generar reporte financiero"""
        return self.client.request('GET', '/reports/financial', params=params)

    def approvals(self) -> Dict:
        """Generar reporte de aprobaciones pendientes"""
        return self.client.request('GET', '/reports/approvals')

    def attendance(self, **params) -> Dict:
        """Generar reporte de asistencia"""
        return self.client.request('GET', '/reports/attendance', params=params)

    def predict_trend(self, metric: str) -> Dict:
        """Predecir tendencia de una métrica"""
        return self.client.request('GET', f'/reports/predict/{metric}')


class SearchModule:
    """Módulo de búsqueda"""

    def __init__(self, client: BGEClient):
        self.client = client

    def advanced(self, query: str, **options) -> Dict:
        """Búsqueda avanzada"""
        params = {'q': query, **options}
        return self.client.request('GET', '/search/advanced', params=params)

    def suggestions(self, query: str, limit: int = 10) -> Dict:
        """Obtener sugerencias de búsqueda"""
        return self.client.request('GET', '/search/suggestions', params={
            'q': query,
            'limit': limit
        })

    def analytics(self) -> Dict:
        """Obtener analytics de búsqueda"""
        return self.client.request('GET', '/search/analytics/summary')


# =============================================================================
# EJEMPLO DE USO
# =============================================================================

if __name__ == '__main__':
    # Ejemplo básico
    client = BGEClient(
        api_url='http://localhost:3000',
        api_key='your-api-key-here'
    )

    try:
        # Login
        result = client.auth.login('admin@bge.edu.mx', 'password')
        print(f"Login exitoso: {result}")

        # Listar estudiantes
        students = client.students.list(limit=10)
        print(f"Estudiantes: {students}")

        # Crear webhook
        webhook = client.webhooks.create({
            'url': 'https://example.com/webhook',
            'events': ['user.created', 'grade.updated'],
            'description': 'Webhook de prueba'
        })
        print(f"Webhook creado: {webhook}")

    except BGEError as e:
        print(f"Error: {e}")
