# 💣 Word Bomb Game

A simple but elegant word game where players must type words containing specific letter combinations before time runs out!

## 🎮 How to Play

1. Select your difficulty level:
   - **Easy**: 15 seconds per round
   - **Medium**: 10 seconds per round
   - **Hard**: 7 seconds per round

2. You'll be shown a letter combination (e.g., "AB", "CH", "ER")

3. Type a word that contains those letters before the timer runs out

4. Longer words earn more points (word length × 5 points, minimum 10)

5. You have 3 lives - lose one each time the timer runs out

6. Try to get the highest score possible!

## 🚀 Deployment on Netlify

### Method 1: Drag & Drop (Easiest)

1. Go to [Netlify](https://www.netlify.com/)
2. Sign up or log in
3. Drag and drop the entire project folder onto the Netlify dashboard
4. Your site will be live in seconds!

### Method 2: Git Integration

1. Push this project to a GitHub repository
2. Go to [Netlify](https://www.netlify.com/)
3. Click "New site from Git"
4. Connect your GitHub account
5. Select your repository
6. Click "Deploy site"

### Method 3: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Navigate to your project directory
cd word-bomb

# Deploy
netlify deploy --prod
```

## 📁 Project Structure

```
word-bomb/
├── index.html      # Main HTML structure
├── styles.css      # Elegant styling and animations
├── game.js         # Game logic and functionality
└── README.md       # This file
```

## ✨ Features

- **Three Difficulty Levels**: Choose your challenge
- **Smooth Animations**: Elegant transitions and effects
- **Responsive Design**: Works on desktop and mobile
- **Score Tracking**: Points based on word length
- **Lives System**: 3 chances to keep playing
- **Used Words Tracker**: See all the words you've found
- **Visual Timer**: Animated countdown bar
- **Instant Feedback**: Clear success/error messages

## 🎨 Design Highlights

- Modern gradient background
- Glassmorphism card design
- Smooth animations and transitions
- Responsive layout for all devices
- Accessible color scheme
- Clean, minimalist interface

## 🛠️ Technologies Used

- HTML5
- CSS3 (with CSS Variables and Animations)
- Vanilla JavaScript (ES6+)

## 📝 Game Rules

- Words must be at least 3 letters long
- Words must contain the given letter combination
- Each word can only be used once per game
- Case doesn't matter (WORD = word = WoRd)

## 🎯 Tips for High Scores

- Think of longer words for more points
- Common letter combinations like "ER", "IN", "TH" have many word options
- Don't panic - you have time to think!
- Practice makes perfect!

## 📄 License

Free to use and modify. Have fun!

## 🤝 Contributing

Feel free to fork this project and add your own features:
- Dictionary API integration for word validation
- Multiplayer mode
- Leaderboard system
- Sound effects
- More letter combinations
- Power-ups and bonuses

Enjoy playing Word Bomb! 💣✨
