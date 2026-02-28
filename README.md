# ACE Exam Simulator 🚀

Simulador de examen interactivo para la certificación **Google Cloud Associate Cloud Engineer (ACE)**. Utiliza Inteligencia Artificial (OpenAI GPT) para generar preguntas dinámicas y personalizadas basadas en los temas oficiales del examen.

## 🌟 Características

- **Generación con IA**: Preguntas únicas cada vez, evitando la memorización de bancos de preguntas fijos.
- **Temario Oficial**: Cobertura completa de las secciones de la guía de certificación ACE (IAM, GKE, VPC, Compute Engine, etc.).
- **Feedback Inmediato**: Explicaciones detalladas para cada respuesta (correcta o incorrecta).
- **Revisión de Errores**: Al finalizar, revisa todas las preguntas fallidas con su respectiva justificación.
- **Contenerizado**: Listo para desplegar con Docker y Nginx.

## 🛠️ Tecnologías

- **Frontend**: HTML5, Vanilla CSS, JavaScript (ES6+).
- **IA**: OpenAI API (GPT-4o-mini).
- **Infraestructura**: Docker, Docker Compose, Nginx.

## 📋 Requisitos Previos

- [Docker](https://www.docker.com/get-started) y Docker Compose instalados.
- Una clave de API de OpenAI válida.

## 🚀 Instalación y Ejecución

1.  **Clonar el repositorio**:
    ```bash
    git clone <url-del-repositorio>
    cd simuladorACE
    ```

2.  **Configurar variables de entorno**:
    Crea un archivo llamado `env.js` en la raíz del proyecto (o edita el existente si no usas Docker) con el siguiente formato:
    ```javascript
    window.ENV = {
      OPENAI_API_KEY: 'tu_clave_de_api_aqui'
    };
    ```
    *Nota: Si utilizas Docker Compose, también puedes pasar la clave como variable de entorno.*

3.  **Levantar el servicio con Docker**:
    ```bash
    docker-compose up -d
    ```

4.  **Acceder al simulador**:
    Abre tu navegador en `http://localhost:8080`.

## 📖 Uso

1.  Al ingresar, verás el panel de **Generar Examen**.
2.  Ingresa la cantidad de preguntas que deseas (ej. 10).
3.  Haz clic en **Generar Examen**. La IA preparará el cuestionario en unos segundos.
4.  Responde las preguntas. Recibirás feedback inmediato con el botón "Ver explicación".
5.  Al terminar, obtendrás tu puntuación y una recomendación sobre si estás listo para el examen oficial.

## ⚠️ Nota de Seguridad

Asegúrate de no subir tu archivo `env.js` o `.env` a repositorios públicos, ya que contienen tu clave privada de OpenAI. El archivo `.gitignore` está configurado para evitarlo.

---
Mantenido por el equipo de desarrollo. ¡Mucho éxito en tu certificación ACE!
