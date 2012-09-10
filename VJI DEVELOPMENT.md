###########
VJI Read Me
###########

-----

Website: Dulux
Local Repo: //vj/Resources/Git/Dulux/Website-Template.git
Github Repo: https://github.com/VisualJazz/
Backend: Umbraco
Integration Team:

-----


{ General }

When integrating the site it is **very important** that any css & JavaScript files we have provided are not modified, if for any reason additional css or JavaScript are needed please ensure it is placed in your own external .css and .js files, we also recommend that no CSS or JavaScript is added inline to any pages on the site, always use external files.
---


{ SHTML/SSI Includes }

Common elements (header footer etc) may be stored in **/includes** folder, and rendered using SSI.
---


{ CSS }

If whist developing we are using **@import** to call in css css files during integration.
---


{ JavaScript Plugins }

We have one custom JavaScript file **vj-global.js** for all custom JavaScript (please do not modify), any plugins we use (excluding libraries, jquery etc) will be stored in the plugins folder on completion of development **all plugins will be added to the plugins.js folder and the plugins folder will also be removed**
---