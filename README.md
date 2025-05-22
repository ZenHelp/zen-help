# ℹ️ Zen Help - Fast, Neat, and Helpful ❤️
This is a place where users can freely post about all their issues for Zen and quickly get reliable responses.
Issues created here aren't issues with Zen but rather are people who need help with setting up stuff, creating mods, and more.

# Contents

## Mods
**This contains the mod related discussions and issue templates.**

### Mod Creation
There are mutiple ways to create mods for Zen Browser, we reccomend you make your mods compadible with _at least_ 2 of the 3.
* **Zen Mods - Native**
  * Documentation - How to properly create a mod
  * Theme Creation Ticket - Create your theme after you have followed the proper documentation
  * Bug Ticket - For technical bugs, issues with the mod creation code
  * Question Channel - Issues on With your code, Questions you have about how it works, or how to acomplish something

* **Sine Mods - Externally Managed (JavaScript Compatible)**
  * Documentation - How to properly create a mod
  * Theme Creation Ticket - Create your theme after you have followed the proper documentation
  * Bug Ticket - For technical bugs, issues with the mod creation code
  * Question Channel - Issues on With your code, Questions you have about how it works, or how to acomplish something

* **Silktheme Store - Externally Managed (Compadible on _Most_ Firefox Browsers)**
  * Documentation - How to properly create a mod
  * Theme Creation Ticket - Create your theme after you have followed the proper documentation
  * Bug Ticket - For technical bugs, issues with the mod creation code
  * Question Channel - Issues on With your code, Questions you have about how it works, or how to acomplish something

### [Mod Requests](https://github.com/ZenHelp/zen-help/discussions/2)
Please submit any mod requests here. Ensure you read the overview before making a request. We will try to make an issue ticket quickly if your idea is plausible.

## Theme Customization
Mods are cool, but themes are cooler - especially if they are _yours_, this is a proper guide on how to create a theme for Zen Browser

## userChrome.css
`userChrome.css` is Firefox (and also Zen's) way of letting you customize your browser, using `CSS`.
* **Setup**\
  Follow the guide from the Zen Browser: [Live Editing Zen Theme](https://docs.zen-browser.app/guides/live-editing)
  
  Note: If you are unable to open the browser console check if the config, `devtools.chrome.enabled` is true

* **Learning The ropes**\
  After setup you are free to start theming, if you do not know CSS we reccomend using a tool like ChatGPT to learn basic syntax as it is not vary hard. If you have no interest in learning this, or do not have the time, please consider making a Mod Request. Your ideas are valued and we love community projects.
  1. Organization
     Themes are usually organized with the following structure:
     ```
     theme_name/
     ├── assets/
     │   └── images/
     │       ├── main.png
     │       └── module-image.png
     ├── theme_name/
     │   ├── CSS/
     │   │   ├── module-one.css
     │   │   └── module-two.css
     │   ├── JS/
     │   │   └── script.uc.js     # Only compatible with Sine
     │   └── Assets/
     │       └── icons/
     │           └── icon-one.svg
     ├── modfiles/
     │   ├── preferences.json
     │   └── theme.json
     ├── UserChrome.css
     └── README.md
     ```
     But when creating and testing a theme it is usually helpful to have all of your `CSS` code in your `userChrome.css` file (so trhat you can live test, because you cannot test files using CSS file imports), and then leave the assets and `JS` in there proper paths. When writing in a `userChrome.css` file it helps if you use comments `/* --- Module Name --- */` To organize your files. 
2. Creation
   Creating a theme is not always east, so here are a few things that will help:
   1. Make use of the inspect button
      This allows you to easily find elements and there classes and ids, good for CSS and JS
   2. Use the Layout and Computed tabs
      These allow you to find issues on why your CSS might not be applying
---
If you need help, you can always create an issue here and we will get right with you!

# Disclaimer: **THIS IS A WIP, AND A DRAFT PR. NOT COMPLETED NOT FINAL, AWAITING OVERVIEW**
