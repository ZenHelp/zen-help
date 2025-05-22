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
Mods are cool, but themes are cooler - especially if they are _yours_, this is a proper guide on how to create a theme for Zen Browser\

`userChrome.css` & `userContent.css` are Firefox (and also Zen's) way of letting you customize your browser, using `CSS`.
* **Setup**\
  Follow the guide from the Zen Browser: [Live Editing Zen Theme](https://docs.zen-browser.app/guides/live-editing)
  
  Note:
   * If you are unable to open the browser console check if the config, `devtools.chrome.enabled` is true
   * `userContent.css` is the same as `userChrome.css` but for websites. Please view documentation [here](). 

* **Creating a Mod**\
  After setup you are free to start theming, if you do not know CSS we reccomend using a tool like ChatGPT to learn basic syntax as it is not vary hard. If you have no interest in learing this, or do not have the time, please consider making a Mod Request. Your ideas are valued and we love community projects.
1. Organization\
     Themes are usually organized with the following structure for Sine Mods:
     ```
     theme_name/
     ├── assets/
     │   └── images/
     │       ├── main.png
     │       └── module-image.png
     ├── theme_name/
     |   ├── theme_name.css
     |   ├── theme-name-config.css    # This is used for the prefrences.json file
     │   ├── CSS/
     |   |   └── Modules/
     |   │   │   ├── module-one.css
     |   │   │   └── module-two.css
     |   |   └──Pages/
     │   ├── JS/
     │   │   └── script.uc.js     # Only compatible with Sine
     │   └── Assets/
     │       └── icons/
     │           └── icon-one.svg
     ├── modfiles/
     │   ├── preferences.json
     │   └── theme.json
     ├── UserChrome.css
     └── LICENCE
     └── README.md
     
     ```
     But when creating and testing a theme it is usually helpful to have all of your `CSS` code in your `userChrome.css` file (so trhat you can live test, because you cannot test files using CSS file imports), and then leave the assets and `JS` in there proper paths. When writing in a `userChrome.css` file it helps if you use comments `/* --- Module Name --- */` To organize your files. 
2. Creation
   Creating a theme is not always east, so here are a few things that will help:
   * Make use of the inspect button\
       This allows you to easily find elements and there classes and ids, good for CSS and JS
   * Use the Layout and Computed tabs\
       These allow you to find issues on why your CSS might not be applying
   * Make Use of Preferences and Varibles\
      Prefs and Vars can be used in the preferences.json file to allow users to have more config over a theme. For documentation on how to use them in CSS, please read [this](https://docs.zen-browser.app/themes-store/themes-marketplace-preferences). For detailed instructions on how to use Sine's prefernces, read [this](https://github.com/CosmoCreeper/Sine/wiki/Features#-powerful-new-preference-features). When using CSS varibles that are used across multiple modules (like colors or animation speeds) that you want the user to be able to toggle, crate them in the `theme-name-config.css` file in the :root, so they can be easily edited by the user and are easy to find for contributors.
* **Publishing**
  * File Layout\
  After creating your theme you can begin moving code into individual CSS files, to do this please read the following:
     * In your Mods userChrome.css file, add an import like `@import "theme_name/theme_name.css";`
     * Import all of your module files from `theme_name.css` using the same method but `@import "CSS/modules/module-one.css";`
     * Follow the same steps for `userContent.css` but using "Pages" instead of "Modules"
   * Uploading to GitHub\
  Mod stores use GitHub as their way to find files, update themes (for sine), and display README information. Thus, it is required your theme is open source, and availible to the publish on Github. Here is how to do that:
    * Create a New Repository (this requires a GitHub account)
    * upload your `theme_name` folder into GitHub (Plus Button -> Upload Files)
    * Create a README explaining your theme, this should include an overview, images and description for each feature/module, a detailed list of prefs and varibles, and any thanks/credits for code or assets.
  * Create Issue Ticket to Publish Theme\
    Chose where you are going to publish your theme and create an issue, we reccomend sine or silkbrush. Zen Mods is not supported at this time, due to complex userChrome loading. Follow the steps on the ticket then once you create a ticket a mod from that repo will get back to you shortly.
     * [sine](https://github.com/CosmoCreeper/Sine/issues/new?template=add-theme.yml)
     * silkthemes (currently unfinished, not ticket yet)
     * Share your theme in our [showcase](https://github.com/ZenHelp/zen-help/discussions/13)!
---
If you need help, you can always create an issue [here]() and we will get right with you!
