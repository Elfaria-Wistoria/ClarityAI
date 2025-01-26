from flask import Flask, render_template, request, jsonify, session
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain.chains import LLMChain
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import numpy as np
import os

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Load vectorstore
try:
    vectorstore = Chroma(
        persist_directory="data",
        embedding_function=HuggingFaceEmbeddings(model_name="sentence-transformers/bert-base-nli-max-tokens")
    )
    print("Vectorstore berhasil dimuat.")
except Exception as e:
    print(f"Kesalahan saat memuat vectorstore: {e}")

# Setup retriever
retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 10})

# Setup model AI
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0, max_tokens=None, timeout=None)

# Setup memory
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

# Setup prompt
prompt = ChatPromptTemplate(
    messages=[
        SystemMessagePromptTemplate.from_template(
            "Berikan jawaban yang tidak terlalu panjang."
            "Kamu hanya boleh memberikan informasi yang berasal dari dataset mu saja"
            "Anda adalah asisten chatbot bernama ClarityAI, tetapi Anda memanggil diri Anda dengan sebutan 'Dokter Clarity'"
            "Tugas ClarityAI adalah memberikan informasi berdasarkan informasi di dataset dengan fokus pada pemberian informasi. "
            "Pastikan jawaban ClarityAI selalu terasa seperti ngobrol sama seorang dokter yang sangat profesional dan friendly"
        ),
        MessagesPlaceholder(variable_name="chat_history"),
        HumanMessagePromptTemplate.from_template("{question}")
    ]
)

# Setup conversation chain
conversation_chain = LLMChain(
    llm=llm,
    prompt=prompt,
    memory=memory,
    verbose=True
)


@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chatbot')
def chatbot():
    return render_template('chatbot.html')

@app.route('/get', methods=['GET'])
def get_response():
    user_message = request.args.get('msg')
    
    if "chat_history" not in session:
        session["chat_history"] = []

    conversation_history = session["chat_history"]
    
    result = conversation_chain.run(question=user_message)
    
    conversation_history.append({"sender": "user", "message": user_message})
    conversation_history.append({"sender": "bot", "message": result})

    session["chat_history"] = conversation_history

    return jsonify(result)

@app.route('/load_history', methods=['GET'])
def load_history():
    conversation_history = session.get("chat_history", [])
    return jsonify(conversation_history)

@app.route('/clear_history', methods=['POST'])
def clear_history():
    session.pop("chat_history", None)
    memory.clear()
    return jsonify({"status": "success", "message": "Chat history has been cleared"})

@app.errorhandler(500)
def server_error(error):
    return jsonify({"error": "Internal server error"}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404

if __name__ == '__main__':
    app.run(debug=True)


    from tensorflow.keras.preprocessing import image