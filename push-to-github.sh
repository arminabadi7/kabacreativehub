#!/bin/bash

cd "/Users/arminkaba/Desktop/kabacontent/KabaCreativeHub"

echo "=== Git Push Script ==="
echo "Current directory: $(pwd)"
echo ""

echo "1. Initializing git repository..."
git init

echo "2. Setting up remote..."
git remote remove origin 2>/dev/null
git remote add origin https://arminabadi7:***REMOVED***@github.com/arminabadi7/Kabacontent.git
echo "Remote configured:"
git remote -v

echo ""
echo "3. Configuring git user..."
git config user.name "arminabadi7"
git config user.email "arminabadi7@users.noreply.github.com"

echo ""
echo "4. Adding all files..."
git add -A
echo "Files staged. Status:"
git status --short | head -20

echo ""
echo "5. Committing changes..."
git commit -m "Update: Drag-and-drop improvements, issue task display, and task completion features

- Enhanced drag-and-drop with optimistic updates for instant feedback
- Added visual feedback during drag (opacity, scale, rotation)
- Improved drop zone highlighting with blue borders and shadows
- Updated issue cards to display tasks with checkboxes, points, and member avatars
- Added task completion functionality with checkbox interactions
- Created POST /api/issues/:issueId/tasks endpoint for creating issue tasks
- Created PATCH /api/tasks/:taskId endpoint for updating task completion
- Added comprehensive logging for debugging task creation and fetching
- Fixed task schema to support issue tasks (nullable memberId, added name field)
- Updated database migrations for tasks table structure
- Improved error handling and user feedback throughout"

echo ""
echo "6. Setting branch to main..."
git branch -M main

echo ""
echo "7. Pushing to GitHub..."
git push -u origin main

echo ""
echo "=== Done! ==="
echo "Check https://github.com/arminabadi7/Kabacontent to verify your changes were pushed."

