from flask import Flask, render_template, request, jsonify, session
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain.chains import LLMChain
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from model_handler import ModelHandler
import os

load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Upload config
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

if not os.path.exists(UPLOAD_FOLDER):
   os.makedirs(UPLOAD_FOLDER)
   
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Initialize model handler
model_handler = ModelHandler()

# Load vectorstore
try:
   vectorstore = Chroma(
       persist_directory="data",
       embedding_function=HuggingFaceEmbeddings(model_name="sentence-transformers/bert-base-nli-max-tokens")
   )
   print("Vectorstore loaded successfully.")
except Exception as e:
   print(f"Vectorstore loading error: {e}")

# Setup components
retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 10})
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0)
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

prompt = ChatPromptTemplate(
messages=[
    SystemMessagePromptTemplate.from_template(
        "Berikan jawaban yang ringkas dan jelas. Hanya sampaikan informasi yang berasal dari dataset Anda."
        "Anda adalah ClarityAI, tetapi sebut diri Anda sebagai ‘Dokter Clarity’."
        "Berikan informasi berdasarkan dataset dengan fokus pada penyampaian informasi yang akurat dan mudah dimengerti."
        "Respon seperti seorang dokter profesional yang memiliki pengalaman bertahun-tahun, namun tetap ramah dan empatik."
        "Berperilakulah seperti dokter manusia yang memahami emosi pasien. Gunakan nada bicara yang meyakinkan, penuh perhatian, dan memberikan rasa tenang kepada pasien."
        "Tunjukkan kepedulian terhadap kondisi pasien dengan bertanya secara sopan jika diperlukan, memberikan saran yang relevan, dan merekomendasikan langkah-langkah tindak lanjut."
        "Jika pasien tampak cemas, tenangkan mereka dengan menjelaskan kondisi dengan cara yang tidak membuat panik."
        "Gunakan bahasa yang natural dan tidak terlalu teknis, kecuali pasien memintanya. Sesuaikan respons dengan tingkat pemahaman pasien."
        "Tampilkan empati dengan memberikan dorongan positif, seperti ‘Anda telah melakukan langkah yang tepat dengan berkonsultasi’ atau ‘Saya di sini untuk membantu Anda.’ "
    ),
    MessagesPlaceholder(variable_name="chat_history"),
    HumanMessagePromptTemplate.from_template("{question}")
]
)

conversation_chain = LLMChain(
   llm=llm,
   prompt=prompt,
   memory=memory,
   verbose=True
)

def allowed_file(filename):
   return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_analysis_message(result):
   if result.lower() == 'katarak':
       return ("AI detected potential cataracts. Immediate consultation with an eye doctor is recommended.")
   return ("AI did not detect cataracts. Regular eye check-ups are still recommended.")

@app.route('/')
def home():
   return render_template('index.html')

@app.route('/chatbot')
def chatbot():
   return render_template('chatbot.html')

@app.route('/analyze_image', methods=['POST'])
def analyze_image():
   try:
       if 'file' not in request.files:
           return jsonify({'success': False, 'message': 'No file uploaded'})
           
       file = request.files['file']
       if not allowed_file(file.filename):
           return jsonify({'success': False, 'message': 'Invalid file type'})
           
       filename = secure_filename(file.filename)
       filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
       file.save(filepath)
       
       result = model_handler.predict(filepath)
       os.remove(filepath)
       
       if result:
           return jsonify({
               'success': True,
               'result': result,
               'message': get_analysis_message(result)
           })
       return jsonify({'success': False, 'message': 'Analysis failed'})
       
   except Exception as e:
       return jsonify({'success': False, 'message': str(e)})

@app.route('/get', methods=['GET'])
def get_response():
   user_message = request.args.get('msg')
   
   if "chat_history" not in session:
       session["chat_history"] = []
       
   conversation_history = session["chat_history"]
   result = conversation_chain.run(question=user_message)
   
   # Format markdown/HTML
   result = result.replace('***', '<strong>').replace('**', '<strong>')
   
   conversation_history.append({
       "sender": "user", 
       "message": user_message
   })
   conversation_history.append({
       "sender": "bot", 
       "message": result
   })
   
   session["chat_history"] = conversation_history
   return jsonify(result)

@app.route('/load_history', methods=['GET'])
def load_history():
   return jsonify(session.get("chat_history", []))

@app.route('/clear_history', methods=['POST'])
def clear_history():
   session.pop("chat_history", None)
   memory.clear()
   return jsonify({"status": "success", "message": "Chat history cleared"})

@app.errorhandler(500)
def server_error(error):
   return jsonify({"error": "Internal server error"}), 500

@app.errorhandler(404)
def not_found(error):
   return jsonify({"error": "Not found"}), 404

if __name__ == '__main__':
   app.run(debug=True)