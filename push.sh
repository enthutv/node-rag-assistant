#!/bin/bash

echo "🔄 Staging changes..."
git add .

echo "📝 Enter commit message:"
read msg

git commit -m "$msg"

echo "🚀 Pushing to origin main..."
git push

echo "✅ Done."
