# Dirtpickle's Portfolio

A static HTML/CSS/JavaScript portfolio website designed for GitHub Pages deployment.

## Features

- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Mobile Navigation**: Clean hamburger menu with right-side overlay
- **Image Galleries**: Lightbox functionality for viewing artwork
- **Music Players**: Custom audio players for music tracks
- **Dark Theme**: Professional dark color scheme
- **GitHub Pages Ready**: No build process required

## Structure

- `index.html` - Homepage with featured work
- `music.html` - Music page with audio players
- `character-design.html` - Character design gallery
- Additional pages for other categories
- `styles.css` - All styling and responsive design
- `script.js` - Interactive functionality
- `images/` - Directory for artwork and images
- `music/` - Directory for audio files

## Setup for GitHub Pages

1. Upload your images to the `images/` folder
2. Upload your music files to the `music/` folder
3. Update the data arrays in each page's JavaScript
4. Commit and push to GitHub
5. Enable GitHub Pages in repository settings

## Customization

### Adding Images
Place images in the `images/` folder and update the relevant JavaScript arrays in each HTML file.

### Adding Music
Place audio files (MP3, WAV, OGG) in the `music/` folder and update the `musicData` array in `music.html`.

### Styling
Modify `styles.css` to change colors, fonts, or layout. The CSS uses CSS custom properties for easy theme customization.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Progressive enhancement ensures basic functionality on older browsers

## License

This project is open source and available under the MIT License.