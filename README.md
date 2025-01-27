# ClarityAI - Medical Chatbot for Eye Consultation and Cataract Detection

ClarityAI is an intelligent medical chatbot system that combines natural language processing and computer vision to provide eye health consultations and cataract detection. The system features an empathetic medical assistant (Dr. Clarity) and uses advanced AI to analyze eye images for potential cataract conditions.

## 🌟 Features

- **Medical Consultation Chatbot**
  - Natural and empathetic conversations in Indonesian
  - Professional medical guidance
  - Context-aware responses
  - Personalized health recommendations

- **Cataract Detection**
  - AI-powered image analysis
  - Support for multiple image formats (PNG, JPG, JPEG)
  - Instant detection results
  - Professional medical recommendations based on analysis

- **User-Friendly Interface**
  - Clean and intuitive web interface
  - Real-time chat interactions
  - Easy image upload system
  - Chat history management

## 🚀 Technologies Used

- **Backend**
  - Flask (Python web framework)
  - LangChain with Google Generative AI (Gemini 1.5 Flash)
  - HuggingFace Embeddings
  - ChromaDB for vector storage

- **AI/ML**
  - Custom computer vision model for cataract detection
  - Large Language Model for medical consultations
  - BERT embeddings for context understanding

- **Frontend**
  - HTML/CSS/JavaScript
  - Real-time chat interface
  - Responsive design

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/clarity-ai.git
cd clarity-ai
```

2. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env file with your API keys and configurations
```

5. Run the application:
```bash
python app.py
```

## 📚 Usage

1. **Start Consultation**
   - Navigate to the homepage
   - Click "Start Consultation" to begin chatting with Dr. Clarity
   - Type your questions or concerns about eye health

2. **Cataract Detection**
   - Click "Upload Image" button
   - Select a clear image of the eye
   - Wait for AI analysis
   - Review results and recommendations

3. **View History**
   - Access chat history in the conversation window
   - Clear history using the "Clear Chat" button
   - Download consultation summary (if available)

## 🔐 Environment Variables

Create a `.env` file with the following variables:
```
GOOGLE_API_KEY=your_google_api_key
UPLOAD_FOLDER=uploads
MODEL_PATH=path_to_your_model
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Your Name - *Initial work* - [YourGithub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Thanks to all contributors who have helped with the development
- Special thanks to medical professionals who provided guidance
- Inspiration from existing medical AI systems

## 📞 Support

For support, email edwinsyah23032003@gmail.com or open an issue in the repository.

---
Made with ❤️ for better eye health care accessibility
