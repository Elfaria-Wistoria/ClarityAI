import numpy as np
from tensorflow.keras import models, layers
import tensorflow as tf

class ModelHandler:
    def __init__(self):
        self.model = self.build_model()
        self.load_weights()
        
    def build_model(self):
        model = tf.keras.models.Sequential([
            tf.keras.layers.Conv2D(32, (3,3), activation='relu', input_shape=(150, 150, 3)),
            tf.keras.layers.MaxPooling2D(2, 2),
            tf.keras.layers.Conv2D(64, (3,3), activation='relu'),
            tf.keras.layers.MaxPooling2D(2,2),
            tf.keras.layers.Flatten(),
            tf.keras.layers.Dense(128, activation='relu'),
            tf.keras.layers.Dense(1, activation='sigmoid')
        ])
        model.compile(optimizer='adam',
                     loss='binary_crossentropy',  
                     metrics=['accuracy'])
        return model

    def predict(self, img_path):
        try:
            img = tf.keras.preprocessing.image.load_img(img_path, target_size=(150, 150))
            img_array = tf.keras.preprocessing.image.img_to_array(img)
            img_array = tf.expand_dims(img_array, 0)
            img_array = img_array / 255.0
            
            prediction = self.model.predict(img_array)
            return 'Normal' if prediction[0][0] > 0.5 else 'Katarak'
        except Exception as e:
            print(f"Prediction error: {e}")
            return None

    def load_weights(self):
        try:
            self.model.load_weights('model.h5')
            print("Model weights loaded successfully")
        except Exception as e:
            print(f"Error loading weights: {e}")