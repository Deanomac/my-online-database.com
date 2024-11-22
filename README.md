# my-online-database.com
A online database that uses index.db in the browser to store your database on.
<img src="https://i.imgur.com/R7ABRk6.jpeg">
# My Online Database

A powerful browser-based database management system with rich media support and a flexible form builder. Built with modern web technologies and IndexedDB for local-first data storage.

## Key Features

- **Dual View Mode**: Switch between Table and Form views
- **Rich Media Support**: Handle images, YouTube videos, TikTok embeds, and local video files
- **Dynamic Form Builder**: Drag-and-drop interface with grid snapping
- **Theme System**: Multiple built-in themes including Light, Dark, Excel, RGB, Hacker, and seasonal themes
- **Local-First**: All data stored in browser's IndexedDB - no server required
- **Import/Export**: Support for CSV, JSON, and Google Sheets
- **Advanced Search**: Real-time filtering with column-specific search
- **Keyboard Navigation**: Full keyboard support for efficient data entry

## Privacy & Security

- No cloud storage or synchronization
- No data collection or tracking
- Data persists across sessions
- Immune to browser cache clearing
- Protected from third-party access

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/Deanomac/my-online-database.git
```

2. Open `index.html` in a modern web browser, or serve using a local development server:
```bash
npx serve
```

3. Create your first table using the "New Table" button
4. Add columns with custom types (text, number, date, URL, etc.)
5. Start adding records in either Table or Form view

## Media Support

### Images
- Supports JPG, PNG, GIF, WebP formats
- Automatic thumbnail generation
- Modal preview with zoom
- Direct Imgur integration
<img src="https://i.imgur.com/xnVAr26.jpeg">
### Videos
- YouTube embedding
- TikTok integration
- Local MP4 playback
- Modal player with controls

### Documents
- Text and URL preview
- Formatted text display
- Link validation
- Quick copy functionality
<img src="https://i.imgur.com/BNbMbj8.jpeg">
## Technical Details

### Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge
- Any modern browser with IndexedDB support

### Storage Limits
- Varies by browser and available disk space
- Typically 50MB to several GB
- Export functionality for backup

### Dependencies
- No external libraries required
- Pure JavaScript implementation
- Built with native browser APIs

## Project Structure
example

```
my-online-database/
├── js/
│   ├── appState.js          # Application state management
│   ├── columnManager.js     # Column operations
│   ├── databaseManager.js   # IndexedDB interactions
│   ├── exportManager.js     # Data export functionality
│   ├── formManager.js       # Form view handling
│   ├── importManager.js     # Data import functionality
│   ├── tableManager.js      # Table view handling
│   └── ui.js               # User interface components
├── css/
│   ├── themes/             # Theme stylesheets
│   └── styles.css          # Core styles
├── index.html              # Main application entry
└── README.md              # Project documentation
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by [Symphytum](https://github.com/giowck/symphytum) personal database
- UI/UX influenced by [DB Browser for SQLite](https://sqlitebrowser.org/)
- Thanks to all contributors and maintainers of those projects

## Support


- Visit the [Documentation](https://my-online-database.com/documentation.html) for detailed guides

## Project Status

This project is actively maintained and under continuous development. Check the [CHANGELOG](CHANGELOG.md) for recent updates.
