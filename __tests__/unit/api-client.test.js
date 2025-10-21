/**
 * TESTS UNITARIOS - API Client
 * BGE Héroes de la Patria
 * Fecha: 19 de Octubre, 2025
 */

const APIClient = require('../../js/api-client.js');

// Mock global fetch
global.fetch = jest.fn();

describe('APIClient', () => {
    let apiClient;

    beforeEach(() => {
        apiClient = new APIClient({
            baseURL: 'https://api.test.com',
            timeout: 5000
        });
        fetch.mockClear();
    });

    describe('Constructor', () => {
        test('debería inicializar con opciones por defecto', () => {
            const client = new APIClient();
            // En ambiente de test (jsdom), detectEnvironment() devuelve URL completa de localhost
            expect(client.baseURL).toBe('http://localhost:3000/api');
            expect(client.timeout).toBe(30000);
        });

        test('debería usar opciones personalizadas', () => {
            expect(apiClient.baseURL).toBe('https://api.test.com');
            expect(apiClient.timeout).toBe(5000);
        });
    });

    describe('buildURL', () => {
        test('debería construir URL correctamente con baseURL', () => {
            const url = apiClient.buildURL('/users');
            expect(url).toBe('https://api.test.com/users');
        });

        test('debería manejar endpoints con barra inicial', () => {
            const url = apiClient.buildURL('/users');
            expect(url).toBe('https://api.test.com/users');
        });

        test('debería manejar endpoints sin barra inicial', () => {
            const url = apiClient.buildURL('users');
            expect(url).toBe('https://api.test.com/users');
        });
    });

    describe('GET requests', () => {
        test('debería hacer GET request exitoso', async () => {
            const mockData = { id: 1, name: 'Test' };
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockData,
                headers: new Headers({ 'content-type': 'application/json' })
            });

            const result = await apiClient.get('/users/1');

            expect(fetch).toHaveBeenCalledWith(
                'https://api.test.com/users/1',
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.any(Object)
                })
            );
            expect(result).toEqual(mockData);
        });

        test('debería lanzar error en GET fallido', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });

            await expect(apiClient.get('/users/999'))
                .rejects
                .toThrow();
        });
    });

    describe('POST requests', () => {
        test('debería hacer POST request con datos', async () => {
            const postData = { name: 'New User', email: 'test@test.com' };
            const mockResponse = { id: 1, ...postData };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
                headers: new Headers({ 'content-type': 'application/json' })
            });

            const result = await apiClient.post('/users', postData);

            expect(fetch).toHaveBeenCalledWith(
                'https://api.test.com/users',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(postData),
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json'
                    })
                })
            );
            expect(result).toEqual(mockResponse);
        });
    });

    describe('PUT requests', () => {
        test('debería hacer PUT request para actualizar', async () => {
            const updateData = { name: 'Updated Name' };
            const mockResponse = { id: 1, ...updateData };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
                headers: new Headers({ 'content-type': 'application/json' })
            });

            const result = await apiClient.put('/users/1', updateData);

            expect(fetch).toHaveBeenCalledWith(
                'https://api.test.com/users/1',
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify(updateData)
                })
            );
            expect(result).toEqual(mockResponse);
        });
    });

    describe('DELETE requests', () => {
        test('debería hacer DELETE request', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
                headers: new Headers({ 'content-type': 'application/json' })
            });

            const result = await apiClient.delete('/users/1');

            expect(fetch).toHaveBeenCalledWith(
                'https://api.test.com/users/1',
                expect.objectContaining({
                    method: 'DELETE'
                })
            );
            expect(result).toEqual({ success: true });
        });
    });

    describe('Headers', () => {
        test('debería incluir headers personalizados', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({}),
                headers: new Headers({ 'content-type': 'application/json' })
            });

            await apiClient.get('/users', {
                headers: { 'Authorization': 'Bearer token123' }
            });

            expect(fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer token123'
                    })
                })
            );
        });
    });

    describe('Error handling', () => {
        test('debería manejar errores de red', async () => {
            fetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(apiClient.get('/users'))
                .rejects
                .toThrow('Network error');
        });

        test('debería manejar timeout', async () => {
            const slowClient = new APIClient({ timeout: 100 });

            fetch.mockImplementationOnce(() =>
                new Promise(resolve => setTimeout(resolve, 200))
            );

            await expect(slowClient.get('/slow-endpoint'))
                .rejects
                .toThrow();
        });

        test('debería manejar respuestas no JSON', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                headers: new Headers({ 'content-type': 'text/html' }),
                text: async () => '<html></html>'
            });

            const result = await apiClient.get('/html-page');
            expect(result).toBe('<html></html>');
        });
    });
});
