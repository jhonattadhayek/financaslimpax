#!/bin/bash

echo "Implantando índices do Firestore..."
npx firebase-tools deploy --only firestore:indexes

echo "Índices implantados com sucesso!"
