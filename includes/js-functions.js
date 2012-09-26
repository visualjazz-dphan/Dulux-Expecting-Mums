////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////CONFIG CONSTANTS
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var animateSpeed = 200; //Used for animating dragged and trays
var trayTopUp = -167; //CSS top value when tray is up
var trayTopMid = -141; //CSS top value when tray is midway up
var trayTopHover = -240; //CSS top value when project tray is hovered 
var trayTopDown = 0; //CSS top value when tray is down
var trayHideDelay = 500; //Delay hiding the tray after an item is dropped on it
var serverTimeout = 2000; //Amount of time that server is given to respond.. After this time, the overlay will be removed and page will accept interaction again.
var IE6messageMax = 2; //For IE6 users, show the "upgrade" header message maximum this many times.
var loggingEnabled = true; //Enable the log console (press ` to view when enabled)... It is a good idea to tie this in with logic to enable when in staging / dev environments



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////GLOBAL VARIABLES
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var userOSAgent = navigator.userAgent.toLowerCase();
var isProjectScrapbookPage = false; //Default pages have dock. The only other pageMode is isProjectScrapbookPage - This is determined on document ready
var addables; //jQuery
var mouseCoords = {}; //Store mouse coordinates while cursor moving
var dragged; //jQuery
var draggedOffset; //Correct positioning of dragged with mouse
var draggedIsDragging = false;
var droppableZones; //jQuery
var droppedZone; //Store droppedzone string, if mouse is over a dropzone
var data = {}; //Store the data about the draged - type, ID, and other misc info etc

//The following global variables are set on a mouse down and checked during mouseMove to optimize performance. 
var dropCoordsArray = new Array(); //Storage for the t,r,b,l of all the dropzones so that they do not need to be found during mouseMove
var draggedIcon; //Storage for the dragged Icon so that when its style is changed it does not have to be found from the dom.
var overDrop; //Boolean stores the over dropzone stage so that the draggedIcon's style is not changed constantly during mouseMove
var trayTopOffset = trayTopDown; //Compensates the mouseDown dropZone position detection because of animation of trays.

//The following global variables are used to assist with alerts and various other displays
var isNewProject = 0;
var showPrompt = 0;
var showPrint = 0;
var userLoggedIn = 0;
var promptCustomMessage = "";
var promptOkURL = "";
var promptCancelURL = "";
var promptHideClose = 1;

var IE6messageShown = 0;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////DOCUMENT READY
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
$(document).ready(function () {
    ////Remove various margins for presentation
    $('#content-main div.color-tile:nth-child(4n)').addClass('margin-none'); //Remove Margin right on 4th swatch on colour forecast
    $('div#gallery div.img-wrap:nth-child(4n+1)').addClass('margin-none'); //Remove Margin right on 4th image in photo gallery
    $('div#content.color .colour-cat:nth-child(2n)').addClass('margin-none'); //Remove Margin right on 2nd image in Colour Forecast category page
    //$('.scrapbook div#colours .colour-block:nth-child(3n+1)').addClass('last'); //Remove margin right on the 3rd colour on print scrapbook page
    //$('.scrapbook div#schemes .scheme:nth-child(5n+1)').addClass('last'); //Remove margin right on the 5th scheme on print scrapbook page
    //$('.scrapbook div#pictures img:nth-child(3n+1)').addClass('last'); //Remove margin right on the 3rd image on print scrapbook page
    //$('.scrapbook div#products .product:nth-child(3n+1)').addClass('last'); //Remove margin right on the 3rd product on print scrapbook page

    ////Environment variables
    //Determine platform
    $.platform = {
        mac: /mac/.test(userOSAgent),
        osx: /mac os x/.test(userOSAgent),
        win: /win/.test(userOSAgent),
        linux: /linux/.test(userOSAgent)
    };

    //Some IE7 reports version number as 6.0 The following line fixes this.
    $.browser.version = $.browser.msie && parseInt($.browser.version) == 6 && window["XMLHttpRequest"] ? "7.0" : $.browser.version;

    //Determine pageMode
    if ($("#project-container").length > 0) isProjectScrapbookPage = true; //if the project-container div exist on page, then we must be looking at the project/scrapbook page

    //Cursor should be aligned with centre of dragged according to browser / platform
    draggedOffset = ($.browser.mozilla) ? 35 : 27;

    ////Create the required DIV element at runtime
    //Preloaded images... Preload images so they can appear instantaneously
    $("<div id='preloadedImages' style='display:none;'></div>").appendTo("body");
    preloadImages("/css/imgs/typecursor-product.gif", "/css/imgs/typecursor-picture.gif", "/css/imgs/typecursor-video.gif", "/css/imgs/typecursor-retailer.gif");

    //Log console
    if (loggingEnabled) $("<div id='logg'>DEBUG:<br></div>").appendTo("body"); $("<style type='text/css'>#logg{position:fixed;display:none;right:0;top:0;width:300px;height:150px;background-color:#DDD;overflow:scroll;text-align:left;}</style>").appendTo("head"); $(document).keypress(function (e) { if (e.which == 96) { $("#logg").toggle(); return false; } });

    //Dragged cursor
    $("<div id='dragged'></div>").appendTo("body");
    dragged = $("#dragged");

    //Wait-page-overlay; used to prevent any page interaction while communicating with server
    $("<div id='waitoverlay'></div>").appendTo("body");

    ////Take care of the addables
    activateAddables();

    ////Track mouse movements required for dragging "dragged"
    $().mousemove(
		function (e) {
		    if (draggedIsDragging) {
		        updateMouseCoords(e);
		        moveDragged();
		        detectDropzone();
		        //perform any dropzone hover animation below
		        if (droppedZone != "" && !overDrop) {
		            overDrop = true;
		            draggedIcon.css({ margin: "5px 0 0 5px" })
		        } else if (droppedZone == "" && overDrop) {
		            overDrop = false;
		            draggedIcon.css({ margin: "0" });
		        }
		    }
		}
	);

    ////Check / send requests / cleanup on mouseup
    $().mouseup(
		function () {
		    //Only need to do the clean up if mouseup from a drag
		    if (draggedIsDragging) {
		        detectDropzone();
		        if (droppedZone != "") {
		            logg(droppedZone + " is hit with type:" + data.ItemType + ", ID:" + data.ItemID);
		            compileRequestDrop(droppedZone);
		            setTimeout("hideTrays()", trayHideDelay); //Delayed tray hide if there was a valid drop
		        } else {
		            hideTrays();
		        }
		        draggedIsDragging = false;
		        animateDragged(0);
		        doOverlay("hide");
		        setPageCursor("auto");
		        setPageSelectable(true);
		    }
		}
	);

    ////Handle dockProject tray hover animation
    //Hide the initial dockProject tray's next step display, so it doesn't show behind dropzones
    $("#project p, #project .dockDropzones, #dockProjectColoursWrapper").hide();
    $("#project").mouseenter(
		function () {
		    if (!draggedIsDragging) {
		        $("#project p, #project .dockDropzones, #dockProjectColoursWrapper").fadeIn(animateSpeed);
		        $('#dockProjectColoursWrapper').css('margin-top', '80px').css('position', 'relative').css('top', '-64px');
                $('#project .dockDropzones').css('top', '113px');
		        trayTopOffset = trayTopHover; animateTray("#project");
		    }
		}
	);
    $("#project").mouseleave(
		function () {
		    if (!draggedIsDragging) {
		        $("#project p, #project .dockDropzones, #dockProjectColoursWrapper").fadeOut(animateSpeed);
		        $('#dockProjectColoursWrapper').css('margin-top', '').css('position', '').css('top', '');
                $('#project .dockDropzones').css('top', '');
		        hideTrays();
		    }
		}
	);

    ////Load the dock OR page data for initial presentation of page
    if (isProjectScrapbookPage) {
        logg("<a href='javascript:compileRequestLoad(\"pageProject\")'>Reload project</a>");
        logg("<a href='javascript:compileRequestLoad(\"pageScrapbook\")'>Reload scrapbook</a>");
        compileRequestLoad("pageProject");
        compileRequestLoad("pageScrapbook");
        if (isNewProject) { DuluxAlert("project"); } //only show the new project alert if the XML node loaded states that this is a new project
    } else {
        logg("<a href='javascript:compileRequestLoad(\"dockProject\")'>Reload project</a>");
        logg("<a href='javascript:compileRequestLoad(\"dockScrapbook\")'>Reload scrapbook</a>");
        compileRequestLoad("dockProject");
        compileRequestLoad("dockScrapbook");
    }

    ////Firefox has a bug where dragging from a SWF causes trays in the dock to be text-selected. Line below should cancel this issue.
    if ($("#dock-wrap").length > 0) { //ie if #dock-wrap exists
        document.getElementById("dock-wrap").style.MozUserSelect = "none";
    }

    ////Category Page Accordion Text
    categories = $('ul.category-list li:not(li li)')
    categories.each(function () {
        if ($(this).children('ul').length == 0) { //i.e. doesn;t have a contentUL 
            $(this).find('div.color-swatch').addClass('up'); //"up" state hides the drop arrow.
            //do nothing more
        } else {
            $(this).find('h2').click(function () {
                //remove "up" class for all categories that have a contentUL
                categories.each(function () {
                    if ($(this).children('ul').length > 0) {
                        $(this).find('div.color-swatch').removeClass('up');
                    }
                });
                contentUL = $(this).next("ul");
                if (contentUL.is(':visible')) {
                    contentUL.slideUp(animateSpeed);
                } else {
                    $("ul.category-list ul").slideUp(animateSpeed); //slide all up..
                    contentUL.slideDown(animateSpeed);
                    $(this).prev().addClass('up');
                }
            });
        }
    });

    ////Dependant hide/show on selection
    $('#projects .project h3').click(function () {
        if ($(this).parent().hasClass('open')) {
            $(this).parent().removeClass('open');
            $(this).parent().find(".project-detail").slideUp(animateSpeed);
        } else {
            $(this).parent().addClass('open');
            $(this).parent().find(".project-detail").slideDown(animateSpeed);
            if ($.browser.version == "7.0") { $("p.sml").hide().show(); } //This fixes a stupid bug in IE7 that causes this text to be hidden. "Peekaboo" bug in IE7 may possibly be resolved by adding position:relative to the container element.
        };
    });

    ////Show the colour scheme tab by default
    $('#colour-scheme .project-detail').removeClass('hide');
    $('#colour-scheme').addClass('open');

    ////Scrapbook Tabs
    $('#scrapbook-body #head ul a').each(function (i) {
        var tab = $(this);
        tab.data('index', i);
        tab.click(function () {
            $('#scrapbook-body #head ul li').removeClass('active');
            $(this).parent().addClass('active');
            $('#scrapbook-body #body div.tab').addClass('hidden');
            $('#scrapbook-body #body div.tab:nth-child(' + ($(this).data('index') + 1) + ')').removeClass('hidden');
        });
    });

    ////Disable Copy/Paste of form verify inputs
    $('input.verify').bind("paste", function (e) { return false; }); //disable paste functionality
    $('input.verify').bind("contextmenu", function (e) { return false; }); //disable context menu

    ////Add last class to items in Print page layouts
    $('#wrapper.scrapbook .colour-block:nth-child(3n+1)').addClass('last');
    $('#wrapper.scrapbook .scheme:nth-child(5n+1)').addClass('last');
    $('#wrapper.scrapbook #pictures img:nth-child(3n+1)').addClass('last');
    $('#wrapper.scrapbook #products .product:nth-child(3n+1)').addClass('last');

    ////Detects the file extension and adds the extension as a class.
    //	$("a[href$='.pdf']").addClass("pdf"); //Apply CSS class to all A links that end in .pdf
    //	$("a[href$='.doc']").addClass("doc"); //Apply CSS class to all A links that end in .doc
    $("a[href^='http://']").addClass("ExternalLink"); //Apply CSS class to all A links that start with http://
    $("a[href^='http://www.mydomain.co.uk']").removeClass("ExternalLink"); //Remove CSS class to all A links that start with http://www.YOURDOMAINHERE.co.uk
    $("a[href^='mailto:']").addClass("Mail"); //Apply CSS class to all A links that start with mailto:

    ////On the project/scrapbook page, the scrapbook panel needs to be in view at all times...
    if (isProjectScrapbookPage) {
        var scrapbookScrollOffset = ($.browser.msie && $.browser.version <= 6) ? 0 : 148; //cater for IE6 offset when scrolling scrapbook into view
        $('#scrapbook-container').stop().animate({ top: 192 - scrapbookScrollOffset }, animateSpeed, 'swing'); //Set initial position;
        $(window).scroll(function () {
            scrapbookTarget = ($(window).scrollTop() < 170) ? 192 - scrapbookScrollOffset : $(window).scrollTop() - scrapbookScrollOffset + 20;
            $('#scrapbook-container').stop().animate({ top: scrapbookTarget }, animateSpeed, 'swing');
        });
    }

    ////Replace the css 'fixed' property that isn't supported in IE 6
    if ($.browser.msie && $.browser.version <= 6) {
        $("#dock-wrap").css({ "position": "absolute" });
        $(window).scroll(function () { $("#dock-wrap").css({ "top": $(window).height() + $(window).scrollTop() - 53 }); });
        $(window).resize(function () { $("#dock-wrap").css({ "top": $(window).height() + $(window).scrollTop() - 53 }); });
        //Below is used to fix the stupid IE6 background image flicker bug http://yelotofu.com/2007/01/proof-that-ie6-is-crap/
        try { document.execCommand("BackgroundImageCache", false, true); } catch (err) { }
    }

    ////IE 6 Upgrade notification
    //Read IE6 message settings from cookie. Value is either NULL, or a string such as "n,xxxxxxxxxxxx"
    //where 'n' is an integer decipting how many visits / sessions this user has spent at this site
    //where 'xxxxxxxxxxxx' is the current sessionID - to check and not increment 'n' unnecessarily.
    IE6messageSettings = $.cookie('IE6messageSettings');

    if (IE6messageSettings == null) {
        //If IE6messageSettings is null, then write the first cookie
        $.cookie('IE6messageSettings', '1,' + sessionID, { expires: 365, path: '/' });
        logg("original cookie written: " + $.cookie('IE6messageSettings'));
    } else {
        //Cookie already exists, get its visit count and sessionID
        cookieData = IE6messageSettings.split(",");
        cookieVisitCount = parseInt(cookieData[0]);
        cookieSessionID = cookieData[1];
        logg("reading cookie values " + cookieVisitCount + ',' + cookieSessionID);

        //If cookie's sessionID does not match the browsers, then write a new cookie
        if (cookieSessionID != sessionID) {
            //Delete old cookie by assigning negative date
            $.cookie('IE6messageSettings', '', { expires: -1, path: '/' });
            //Save new cookie with revised data
            $.cookie('IE6messageSettings', ++cookieVisitCount + ',' + sessionID, { expires: 365, path: '/' });
            logg("updated cookie written: " + $.cookie('IE6messageSettings'));
        }

        //If visit count <= IE6messageMax then show the IE6 message
        if (cookieVisitCount <= IE6messageMax) {
            $('#ie-container').slideDown(2000);
            logg("Showing IE6 message");
        }
    }

    $('#ie-container a.close, #ie-container a.ie-update, #ie-container a.ff-update').click(function () {
        //Closing the messagebar should mean that it will never again be shown to this user, in any future session.
        $(this).parent().parent().slideUp(1000);

        //Delete old cookie by assigning negative date
        $.cookie('IE6messageSettings', '', { expires: -1, path: '/' });
        //Save new cookie with revised data, placing visitcount as very high
        $.cookie('IE6messageSettings', '1000000,xxx', { expires: 365, path: '/' });
        logg("updated cookie written: " + $.cookie('IE6messageSettings'));

        //Redirect browser to clicked href
    });

    ////Done
    logg("---- document ready now ----");

});











////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////DOCUMENT LOADED
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
$(window).load(function () {
    ////Cover images contained in an element with class addable with divs so that the image won't interference with dragging from the addable. Only t be done AFTER images are loaded.
    if ($.browser.safari == false) { //This is NOT a problem with Safari/Chrome
        $(".addable img").each(function () {
            var imageReplacement = $('<div style="background-image:url(' + $(this).attr("src") + '); width:' + $(this).width() + 'px; height:' + $(this).height() + 'px;"></div>');
            //$(this).before(imageReplacement).remove();
        });
    }

});











////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////ACTIVATE ADDABLES
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function activateAddables() {
    $(".addable").each(function () {
        //Cursor control: hover over addable
        $(this).mouseenter(
			function () {
			    setPageCursor("grab");
			    //For flash swatches inside addables for macs.
			    var swf = $(this).find("embed, object");
			    if (swf.length > 0) {
			        swf.mouseenter(function () {
			            setPageCursor("auto");
			        });
			        swf.mouseleave(function () {
			            setPageCursor("grab");
			        });
			    }
			}
		);

        //Cursor control: hover away from addable AND not dragging
        $(this).mouseleave(
			function () {
			    if (!draggedIsDragging) setPageCursor("auto");
			}
		);

        //Perform a grab from an addable
        $(this).mousedown(
			function (e) {
			    updateMouseCoords(e); //Update the coords for the initial mousedown, so dragged appears in correct spot
			    data = grabData($(this).attr("data")); //Sets the global variables for type, ID and misc info for the item to be dragged
			    grabItem(); //Note that grabItem() function sets the draggedIsDragging = true :: NOTE the SWFs will call this same function.
			    initDragVars();
			}
		);

        //Sometimes an addable will contain a link. Need to be able to make this link active (i.e. not allow addable to take focus away and prevent link click
        $(this).find("a").mousedown(
			function (e) {
			    window.location = $(this).attr('href');
			    return false; //Prevents bubbling that would otherwise show dragged when the link inside addable is clicked.
			}
		);

    });
}











////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////MOUSE / DRAGGED / TRAY / DROPZONES etc
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function updateMouseCoords(e) {
    ////Need the mouse coordinates manually from $(document).mousemove, since there will be no events passed when receiving calls from SWFs
    mouseCoords = { x: e.pageX, y: e.pageY };
}

function grabData(dataIn) {
    logg(dataIn);
    ////Parse data in the form of [name=val] into object of name value pairs and return the object
    var objCollection = {}
    if (dataIn != null) {
        //Replace the values, passing each name-value pair and add it to the collection.
        dataIn.replace(
			new RegExp("\\[(\\w+)=([^\\]]*)\\]", "gi"), function ($0, $1, $2) { //Capture two groups (name value) via RegEx
			    objCollection[$1] = $2; //Add the pair to the collection
			}
		);
    }
    return (objCollection);
}

function grabItem() {
    ////This function to be called from HTML elements as well as various SWFs
    //Present the correctly formatted dragged based on type. Also define the valid droppable zones
    switch (data.ItemType) {
        case "3": //Scheme
            dragged.html("<div id='draggedIcon'><div class='scheme' style='background-color:" + num2hex([data.R1, data.G1, data.B1]) + "'></div><div class='scheme' style='background-color:" + num2hex([data.R2, data.G2, data.B2]) + "'></div><div class='scheme' style='background-color:" + num2hex([data.R3, data.G3, data.B3]) + "'></div></div>");
            droppableZones = $("#dockZoneProjectScheme, #dockZoneScrapbookScheme, #pageZoneProjectSchemeWrapper");
            if (!isProjectScrapbookPage) {
                $('.dockDropzones').show();
                droppableZones.show(); trayTopOffset = trayTopUp; animateTray("#project"); animateTray("#scrapbook");
            }
            break;
        case "11": //Colour collection
            dragged.html("<div id='draggedIcon'><div class='scheme' style='background-color:" + num2hex([data.R1, data.G1, data.B1]) + "'></div><div class='scheme' style='background-color:" + num2hex([data.R2, data.G2, data.B2]) + "'></div><div class='scheme' style='background-color:" + num2hex([data.R3, data.G3, data.B3]) + "'></div></div>");
            droppableZones = $("#dockZoneProjectColourCollection");
            if (!isProjectScrapbookPage) {
                $('.dockDropzones').show();
                droppableZones.show(); trayTopOffset = trayTopUp; animateTray("#project");
            }
            break;
        case "1": //Colour
            dragged.html("<div id='draggedIcon' class='colour' style='background-color:" + num2hex([data.R, data.G, data.B]) + "'></div>");
            droppableZones = $("#dockZoneProjectColour1, #dockZoneProjectColour2, #dockZoneProjectColour3, #dockZoneScrapbookColour, #pageZoneProjectColour1, #pageZoneProjectColour2, #pageZoneProjectColour3");
            if (!isProjectScrapbookPage) {
                $('.dockDropzones').show();
                $("#dockProjectColoursWrapper").show(); //This is not a droppablem, but needs to be shown.
                droppableZones.show(); trayTopOffset = trayTopUp; animateTray("#project"); animateTray("#scrapbook");
            }
            break;
        case "2": //Product
            dragged.html("<div id='draggedIcon' class='product'></div>");
            droppableZones = $("#dockZoneProjectProduct, #dockZoneScrapbookProduct, #pageZoneProjectProduct");
            if (!isProjectScrapbookPage) {
                $('.dockDropzones').show();
                droppableZones.show(); trayTopOffset = trayTopMid; animateTray("#project"); animateTray("#scrapbook");
            }
            break;
        case "4": //Picture
            dragged.html("<div id='draggedIcon' class='picture'></div>");
            droppableZones = $("#dockZoneScrapbookPicture");
            if (!isProjectScrapbookPage) {
                $('.dockDropzones').show();
                droppableZones.show(); trayTopOffset = trayTopMid; animateTray("#scrapbook");
            }
            break;
        case "7": //Calculation
            dragged.html("<div id='draggedIcon' class='calculation'>" + data.ItemValue + "<span>litres</span></div>");
            droppableZones = $("#dockZoneProjectCalculation");
            if (!isProjectScrapbookPage) {
                $('.dockDropzones').show();
                droppableZones.show(); trayTopOffset = trayTopMid; animateTray("#project");
            }
            break;
        case "5": //Video
            dragged.html("<div id='draggedIcon' class='video'></div>");
            droppableZones = $("#dockZoneScrapbookVideo");
            if (!isProjectScrapbookPage) {
                $('.dockDropzones').show();
                droppableZones.show(); trayTopOffset = trayTopMid; animateTray("#scrapbook");
            }
            break;
        case "8": //Retailer
            dragged.html("<div id='draggedIcon' class='retailer'></span></div>");
            droppableZones = $("#dockZoneProjectRetailer");
            if (!isProjectScrapbookPage) {
                $('.dockDropzones').show();
                droppableZones.show(); trayTopOffset = trayTopMid; animateTray("#project");
            }
            break;
        default: //No valid item type has been provided, exit the function, no dragging
            return false;
    }

    //Set initial position for dragged when it makes its appearance
    dragged.css({
        left: (mouseCoords.x - draggedOffset) + "px",
        top: (mouseCoords.y - draggedOffset) + "px"
    });

    //Other settings / actions required
    draggedIsDragging = true; //Start dragging. Note that the $(document).mouseup will determine when the dragging ends
    animateDragged(1);
    doOverlay("show");
    setPageCursor("grabbing");
    setPageSelectable(false);
}

function setPageCursor(cursor) {
    ////Sets page.css cursor to one of: 'auto', 'wait', 'grab', or 'grabbing'
    var cursorType;
    if (cursor == "grab") {
        if ($.browser.mozilla) cursorType = "-moz-grab";
        else cursorType = "url(css/imgs/" + cursor + ".cur), pointer";
    } else if (cursor == "grabbing") {
        if ($.platform.mac) cursorType = "default"; //the mousedown grabbing cursor is not supported correctly for us on Mac browsers
        else if ($.browser.mozilla) cursorType = "-moz-grabbing";
        else cursorType = "url(css/imgs/" + cursor + ".cur), pointer";
    } else {
        cursorType = cursor;
    }
    $("body").css("cursor", cursorType);
}

function animateDragged(show) {
    ////Animate the dragged show/hide
    if ($.browser.msie) { //IE fade in has bad results when using transparent PNGs - Even IE8!!
        (show) ? dragged.show() : dragged.hide();
    } else {
        (show) ? dragged.fadeIn(animateSpeed) : dragged.fadeOut(animateSpeed);
    }
}

function moveDragged() {
    ////Move dragged if draggedIsDragging
    dragged.css({
        left: (mouseCoords.x - draggedOffset) + "px",
        top: (mouseCoords.y - draggedOffset) + "px"
    });
}

function animateTray(tray) {
    ////Animate tray based on the direction
    $(tray).stop().animate({ "top": trayTopOffset + "px" }, animateSpeed);
}

function hideTrays() {
    ////Hide the trays (regardless of which is open)
    if (!isProjectScrapbookPage) {
        trayTopOffset = trayTopDown;
        animateTray("#project");
        animateTray("#scrapbook");
        //Also hide all dropzones in trays, so they won't be detected by detectDropzone()
        $("#dockProjectColoursWrapper, #dockZoneProjectScheme, #dockZoneProjectColourCollection, #dockZoneProjectProduct, #dockZoneProjectCalculation, #dockZoneProjectRetailer, #dockZoneScrapbookColour, #dockZoneScrapbookScheme, #dockZoneScrapbookProduct, #dockZoneScrapbookPicture, #dockZoneScrapbookVideo").fadeOut(animateSpeed);
        $('.dockDropzones').hide();
    }
}

function initDragVars() {
    ////On mousedown, determine valid dropzones on page and their locations so that we can later check against them
    draggedIcon = $("#draggedIcon");
    overDrop = false;
    dropCoordsArray.length = 0;
    droppableZones.each(
		function () {
		    if (($(this).length > 0) && $(this).is(':visible')) { //if droppable zone exists and is visible
		        var o = new Object();
		        o.l = $(this).offset().left;
		        o.t = $(this).offset().top + trayTopOffset; //Add trayTopOffset because this function is called before trays slide up. For project/scrapbook page, trayTopOffset should remain 0, as dropzones are static on mousedown 
		        if (($.browser.safari) && (!isProjectScrapbookPage)) { //Safari calculates the top and left of the dropzones from viewport, not page. ////NOTE - the ProjectScrapbookPage does not need this.. Possibly related to the dock being CSS fixed ????
		            o.l = o.l + $(window).scrollLeft();
		            o.t = o.t + $(window).scrollTop();
		        }
		        o.r = o.l + $(this).width();
		        o.b = o.t + $(this).height();
		        o.id = $(this).attr("id");
		        dropCoordsArray[dropCoordsArray.length] = o;
		    }
		}
	);
}

function detectDropzone() {
    ////Check if the cursor is in a dropzone, by checking against all possible dropzones that are shown:visible 
    droppedZone = ""; //= DOM ID, if in a zone else ""
    for (var i = 0, l = dropCoordsArray.length; i < l; i++) {
        var o = dropCoordsArray[i];
        if ((mouseCoords.x > o.l) && (mouseCoords.x < o.r) && (mouseCoords.y > o.t) && (mouseCoords.y < o.b)) {
            droppedZone = o.id;
            break;
        }
    }
}

function editProjectTitle() {
    h2 = $("#project-container #projects h2");
    currentTitle = h2.text().replace("'", "\'").replace("\"", "\'");
    oldTitle = currentTitle;
    h2.html("<input type='text' id='newProjectTitle' maxlength='21' value=\"" + currentTitle + "\"> <a href='javascript:compileRequestProjectRename();' style='font-size:0.56em;'>save</a> <a href='javascript:cancelProjectTitle();' style='font-size:0.56em;'>cancel</a>");
    $("#project-container #projects .proj-edit").hide();
    //Select the text in the textbox
    $("#newProjectTitle").focus();
    $("#newProjectTitle").select();
}

function cancelProjectTitle() {
    $("#project-container #projects h2").html(oldTitle);
    $("#project-container #projects .proj-edit").show();
}











////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////FLASH INTERFACE
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function grabFlashItem(id, x, y, dataIn) {
    ////SWFs to call this function.
    //id:(int)HTML element containing the SWF
    //x&y:(int)X & Y coordinates of mouse within the SWF
    //dataIn:(string)the data to be passed"
    logg("Flash ID: " + id);
    logg("Flash x,y: " + x + "," + y);
    logg("Flash dataIn: " + dataIn);
    mouseCoords = { x: $("#" + id).offset().left + x, y: $("#" + id).offset().top + y} //Update mouse coordinates based on DOM ID and X/Y passed from Flash...
    data = grabData(dataIn); //Set the data object, so we know everything we need about the addable/dragged
    grabItem();
    initDragVars();
}

function flashDragCheck(id) {
    return draggedIsDragging;
}











////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////SERVER COMMS
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function compileRequestLoad(target) {
    ////Load the values into the selected target
    ////target: dockProject|dockScrapbook|pageProject|pageScrapbook
    switch (target) {
        case "dockProject":
            webServiceURL = WEBSERVICE_PROJECT_LOAD + "?SessionId=" + sessionID; processRequest("dockProject", webServiceURL); break;
        case "dockScrapbook":
            webServiceURL = WEBSERVICE_SCRAPBOOK_LOAD + "?SessionId=" + sessionID; processRequest("dockScrapbook", webServiceURL); break;
        case "pageProject":
            webServiceURL = WEBSERVICE_PROJECT_LOAD + "?SessionId=" + sessionID; processRequest("pageProject", webServiceURL); break;
        case "pageScrapbook":
            webServiceURL = WEBSERVICE_SCRAPBOOK_LOAD + "?SessionId=" + sessionID; processRequest("pageScrapbook", webServiceURL); break;
    }
}

function compileRequestDrop(droppedZone) {
    ////Organise and call requests based on droppedZone.
    //call the correct service URL below, based on the droppedZone
    switch (droppedZone) {
        //Dock related 
        case "dockZoneProjectScheme":
            webServiceURL = WEBSERVICE_PROJECT_ADDTO + "?SessionId=" + sessionID + "&itemTypeId=3&itemId=" + data.ItemID; processRequest("dockProject", webServiceURL); break;
        case "dockZoneProjectColourCollection":
            webServiceURL = WEBSERVICE_PROJECT_ADDTO + "?SessionId=" + sessionID + "&itemTypeId=11&itemValue=" + data.ItemValue; processRequest("dockProject", webServiceURL); break;
        case "dockZoneProjectColour1":
            webServiceURL = WEBSERVICE_PROJECT_ADDTO + "?SessionId=" + sessionID + "&itemTypeId=1&itemId=" + data.ItemID + "&positionID=1"; processRequest("dockProject", webServiceURL); break;
        case "dockZoneProjectColour2":
            webServiceURL = WEBSERVICE_PROJECT_ADDTO + "?SessionId=" + sessionID + "&itemTypeId=1&itemId=" + data.ItemID + "&positionID=2"; processRequest("dockProject", webServiceURL); break;
        case "dockZoneProjectColour3":
            webServiceURL = WEBSERVICE_PROJECT_ADDTO + "?SessionId=" + sessionID + "&itemTypeId=1&itemId=" + data.ItemID + "&positionID=3"; processRequest("dockProject", webServiceURL); break;
        case "dockZoneProjectProduct":
            webServiceURL = WEBSERVICE_PROJECT_ADDTO + "?SessionId=" + sessionID + "&itemTypeId=2&itemId=" + data.ItemID; processRequest("dockProject", webServiceURL); break;
        case "dockZoneProjectCalculation":
            webServiceURL = WEBSERVICE_PROJECT_ADDTO + "?SessionId=" + sessionID + "&itemTypeId=7&itemValue=" + data.ItemValue; processRequest("dockProject", webServiceURL); break;
        case "dockZoneProjectRetailer":
            webServiceURL = WEBSERVICE_PROJECT_ADDTO + "?SessionId=" + sessionID + "&itemTypeId=8&itemId=" + data.ItemID; processRequest("dockProject", webServiceURL); break;
        case "dockZoneScrapbookScheme":
            webServiceURL = WEBSERVICE_SCRAPBOOK_ADDTO + "?SessionId=" + sessionID + "&itemTypeId=3&itemId=" + data.ItemID; processRequest("dockScrapbook", webServiceURL); break;
        case "dockZoneScrapbookColour":
            webServiceURL = WEBSERVICE_SCRAPBOOK_ADDTO + "?SessionId=" + sessionID + "&itemTypeId=1&itemId=" + data.ItemID; processRequest("dockScrapbook", webServiceURL); break;
        case "dockZoneScrapbookProduct":
            webServiceURL = WEBSERVICE_SCRAPBOOK_ADDTO + "?SessionId=" + sessionID + "&itemTypeId=2&itemId=" + data.ItemID; processRequest("dockScrapbook", webServiceURL); break;
        case "dockZoneScrapbookPicture":
            webServiceURL = WEBSERVICE_SCRAPBOOK_ADDTO + "?SessionId=" + sessionID + "&itemTypeId=4&itemId=" + data.ItemID + "&itemValue=" + data.ItemValue; processRequest("dockScrapbook", webServiceURL); break;
        case "dockZoneScrapbookVideo":
            webServiceURL = WEBSERVICE_SCRAPBOOK_ADDTO + "?SessionId=" + sessionID + "&itemTypeId=5&itemId=" + data.ItemID; processRequest("dockScrapbook", webServiceURL); break;
        //Page related 
        case "pageZoneProjectSchemeWrapper":
            webServiceURL = WEBSERVICE_PROJECT_ADDTO + "?SessionId=" + sessionID + "&itemTypeId=3&itemId=" + data.ItemID; processRequest("pageProject", webServiceURL); break;
        case "pageZoneProjectColour1":
            webServiceURL = WEBSERVICE_PROJECT_ADDTO + "?SessionId=" + sessionID + "&itemTypeId=1&itemId=" + data.ItemID + "&positionID=1"; processRequest("pageProject", webServiceURL); break;
        case "pageZoneProjectColour2":
            webServiceURL = WEBSERVICE_PROJECT_ADDTO + "?SessionId=" + sessionID + "&itemTypeId=1&itemId=" + data.ItemID + "&positionID=2"; processRequest("pageProject", webServiceURL); break;
        case "pageZoneProjectColour3":
            webServiceURL = WEBSERVICE_PROJECT_ADDTO + "?SessionId=" + sessionID + "&itemTypeId=1&itemId=" + data.ItemID + "&positionID=3"; processRequest("pageProject", webServiceURL); break;
        case "pageZoneProjectProduct":
            webServiceURL = WEBSERVICE_PROJECT_ADDTO + "?SessionId=" + sessionID + "&itemTypeId=2&itemId=" + data.ItemID; processRequest("pageProject", webServiceURL); break;
    }
}

function compileRequestDelete(target, itemType, itemID, page) {
    ////Delete items: remember that delete requests can only be initiated from the project / scrapbook page... Never the dock
    ////target: pageProject|pageScrapbook
    if (target == "pageProject") {
        webServiceURL = WEBSERVICE_PROJECT_DELETEFROM + "?SessionId=" + sessionID + "&itemTypeId=" + itemType + "&itemId=" + itemID; processRequest("pageProject", webServiceURL);
    } else {
        webServiceURL = WEBSERVICE_SCRAPBOOK_DELETEFROM + "?SessionId=" + sessionID + "&itemTypeId=" + itemType + "&PageNum=" + page + "&itemId=" + itemID; processRequest("pageScrapbook", webServiceURL);
    }
}

function CWCompileRequestDelete(target, itemType, itemID) {
    compileRequestDelete(target, itemType, itemID, "");
    //reload data in the my projects dock.
    //compileRequestLoad("pageProject");
    $("#dockZoneProjectColour" + itemType).css('background-color', '');
    $("#dockZoneProjectColour" + itemType + ' a.remover').remove();
}

function compileRequestScrapbookSelectpage(itemType, page) {
    webServiceURL = WEBSERVICE_SCRAPBOOK_SELECTPAGE + "?SessionId=" + sessionID + "&itemTypeId=" + itemType + "&PageNum=" + page; processRequest("pageScrapbook", webServiceURL);
}

function compileRequestEmptyScrapbook() {
    if (confirm(CONFIRM_SCRAPBOOK_EMPTY)) {
        webServiceURL = WEBSERVICE_SCRAPBOOK_EMPTY + "?SessionId=" + sessionID; processRequest("pageScrapbook", webServiceURL);
        compileRequestLoad("pageScrapbook");
    }
}

function compileRequestProjectRename() {
    newName = $.trim($("#newProjectTitle").val());
    $("#project-container #projects h2").html("loading");
    newName = (newName == "") ? "My Project" : newName;
    webServiceURL = WEBSERVICE_PROJECT_RENAME + "?SessionId=" + sessionID + "&itemTypeId=10&ItemValue=" + newName; processRequest("pageProject", webServiceURL);
}

function processRequest(target, webServiceURL) {
    ////Send request to the server
    ////target: dockProject|dockScrapbook|pageProject|pageScrapbook
    try {
        logg("start XML call " + target);
        doOverlay("timed"); //Prevent page interaction until processing is completed
        setPageCursor("wait");
        $.ajax({
            type: "GET",
            url: webServiceURL,
            cache: false,
            dataType: "xml", //The type of data that expected back from the server
            success: function (xmlData) {

                // Added for GA.
                logg("About to run tacking code");
                ProcessTrackingXml(xmlData);

                //Successfully retrieved XML from web services. Now update the page accordingly
                statusCode = $.trim($(xmlData).find('StatusCode').text());
                messageCode = $.trim($(xmlData).find('Message').text());
                nextStepCode = $.trim($(xmlData).find('NextStep').text());
                //Following are only available from project XML
                if ($(xmlData).find('IsNewProject').length > 0) { isNewProject = parseInt($.trim($(xmlData).find('IsNewProject').text())); } //true, if the project is new
                if ($(xmlData).find('ShowPrompt').length > 0) { showPrompt = parseInt($.trim($(xmlData).find('ShowPrompt').text())); } //true if the add-to-dock alert should be shown
                if ($(xmlData).find('ShowPrint').length > 0) { showPrint = parseInt($.trim($(xmlData).find('ShowPrint').text())); } //true if there are enough items in project to be able to print
                if ($(xmlData).find('UserLoggedIn').length > 0) { userLoggedIn = parseInt($.trim($(xmlData).find('UserLoggedIn').text())); } ////true if the user is logged in

                if (isNewProject) {
                    pageTracker._trackPageview('/my-project/newproject');
                }
                
                switch (target) {
                    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////         
                    //Update the dock: Project tray. NB: only action that will be sent here will be "load" - so no "switch (action)" necessary         
                    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////         
                    case "dockProject":
                        $("#dock-wrap #project a.my-project").html($(xmlData).find('ProjectTitle').text());
                        $("#dock-wrap #project p").html("Next: <a href='" + NEXTSTEP_URLS[nextStepCode] + "'>" + NEXTSTEP_CODES[nextStepCode] + "</a>" + AddFacebookPollLinks($(xmlData).find('Colours Colour')));
                        $(xmlData).find('Colours Colour').each(function () {
                            R = $(this).attr('R');
                            G = $(this).attr('G');
                            B = $(this).attr('B');
                            if (typeof (R) != "undefined" && typeof (G) != "undefined" && typeof (B) != "undefined") { //If these values are not blanks
                                $("#dockZoneProjectColour" + $(this).attr('Position')).css("background-color", num2hex([R, G, B]));
                                //remove existing remove buttons.
//                                $("#dockZoneProjectColour" + $(this).attr('Position') + " a.remover").remove();
//                                //add a remove button.
//                                removeButton = '<a class="remover" href="javascript:;" onclick="CWCompileRequestDelete(&quot;pageProject&quot;, ' + $(this).attr('Position') + ', ' + $(this).attr('ItemID') + ');">Remove</a>';
//                                $("#dockZoneProjectColour" + $(this).attr('Position')).append(removeButton);
                            } else {
                                $("#dockZoneProjectColour" + $(this).attr('Position')).css("background-color", "transparent");
                            }
                        });
                        //add popup action for fb link
                        if ($(xmlData).find('Colours Colour').size() == 3) {
                            $('#fbpolllink').bind('click', CreateFacebookPoll);
                        } else {
                            $('#fbpolllink').bind('click', CreateFacebookPoll);
                        }

                        break; //case "dockProject"

                    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////         
                    //Update the dock: Scrapbook tray. NB: only action that will be sent here will be "load" - so no "switch (action)" necessary         
                    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////         
                    case "dockScrapbook":
                        itemCount = parseInt($(xmlData).find('TotalCount').text());
                        itemString = (itemCount == 1) ? " item" : " items";
                        $("#dock-wrap #scrapbook p").html(itemCount + itemString);
                        break; //case "dockScrapbook"

                    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////         
                    //Update the dock: Project page         
                    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////         
                    case "pageProject":
                        ////Returned XML will have all nodes for initial load, and only the changed nodes for anything else.. so easiest way is to simply scan for all known node types and update relevant HTML where a node exists
                        //Colours
                        coloursNode = $(xmlData).find('Colours');
                        nextStepCode = $.trim($(xmlData).find('NextStep').text());

                        //reload the FB poll info links after delete
                        $("#dock-wrap #project p").html("Next: <a href='" + NEXTSTEP_URLS[nextStepCode] + "'>" + NEXTSTEP_CODES[nextStepCode] + "</a>" + AddFacebookPollLinks($(xmlData).find('Colours Colour')));

                        if (coloursNode.length > 0) {
                            $("#colour-scheme .progress").removeClass("done");
                            $('#pageZoneProjectSchemeWrapper').html("");
                            coloursNode.find('Colour').each(function () {
                                R = $(this).attr('R');
                                G = $(this).attr('G');
                                B = $(this).attr('B');
                                if (typeof (R) != "undefined" && typeof (G) != "undefined" && typeof (B) != "undefined") { //If these values are not blanks
                                    $("<div id='pageZoneProjectColour" + $(this).attr('Position') + "' class='removeable' style='background-color:" + num2hex([R, G, B]) + ";'><p class='cat' style='color:" + getTextColourForRGB(R, G, B) + ";'>" + $(this).attr('Name') + "</p><p class='colour' style='color:" + getTextColourForRGB(R, G, B) + ";'>" + $(this).attr('SpecifierNumber') + "</p><a class='remover' href='javascript:;' onclick='compileRequestDelete(\"pageProject\", 1, " + $(this).attr('ItemID') + ");'>Remove</a></div>").appendTo('#pageZoneProjectSchemeWrapper');
                                    $("#colour-scheme .progress").addClass("done");
                                } else {
                                    $("<div id='pageZoneProjectColour" + $(this).attr('Position') + "'></div>").appendTo('#pageZoneProjectSchemeWrapper');
                                }
                            });
                        }
                        //Products
                        productsNode = $(xmlData).find('Products');


                        if (productsNode.length > 0) {
                            $('#products').html("");
                            productCount = 0;
                            $(xmlData).find('Products Product').each(function () {
                                $("<div class='product removeable'><div class='img'><img src='" + $(this).find('ProductThumbImage').text() + "'></div><p class='prod-name'>" + $(this).find('ProductName').text() + "</p><!--p class='prod-desc'>description</p--><a href='javascript:;' class='remover' onclick='compileRequestDelete(\"pageProject\", 2, " + $(this).attr('ItemID') + ");'>Remove</a></div>").appendTo('#products');
                                productCount++;
                            });
                            if (productCount < 3) $("<div id='pageZoneProjectProduct' class='product empty'></div>").appendTo('#products');
                            if (productCount > 0) {
                                $("#my-products .progress").addClass("done");
                            } else {
                                $("#my-products .progress").removeClass("done");
                            }
                        }
                        //Calculation
                        calculationNode = $(xmlData).find('Calculation');
                        if (calculationNode.length > 0) {
                            if (typeof (calculationNode.attr('Liters')) != "undefined") {
                                $('#paint').html("<p id='paint-res' class='removeable'>You need<br /><span class='paint-litre'>" + calculationNode.attr('Liters') + "</span><br />litres<a href='javascript:;' class='remover' onclick='compileRequestDelete(\"pageProject\", 7, " + calculationNode.attr('ItemID') + ");'>Remove</a></p><p class=\"sml\">Wall and trim estimate only.<br />On average 10% of the total is needed for doors and trims. New projects use approximately 30% of the total for preparation products, 40% if using Dulux Once. This calculation does not include ceilings/roofs.</p>");
                                $("#paint-calc .progress").addClass("done");
                                $("#paint-calc .buttons a").removeClass("calculate").addClass("recalc");
                            } else {
                                $('#paint').html("<p id='paint-res' class='removeable'></p>");
                                $("#paint-calc .progress").removeClass("done");
                                $("#paint-calc .buttons a").addClass("calculate").removeClass("recalc");
                            }
                            $("#paint").removeClass("blank");
                        }
                        //Retailer
                        retailerNode = $(xmlData).find('Retailer');
                        if (retailerNode.length > 0) {
                            if (typeof (retailerNode.attr('ItemID')) != "undefined") {
                                $("#closest-retailer .retailer").html("<p class='strong'>" + retailerNode.find('Name').text() + "</p><p>" + retailerNode.find('AddressLine1').text() + "<br />" + retailerNode.find('Suburb').text() + "<br />" + retailerNode.find('State').text() + " " + retailerNode.find('PostCode').text() + " " + retailerNode.find('PhoneNumber').text() + "</p><a href='javascript:;' class='remover' onclick='compileRequestDelete(\"pageProject\", 8, " + retailerNode.attr('ItemID') + ");'>Remove</a>");
                                $("#closest-retailer .progress").addClass("done");
                                $("#closest-retailer .buttons a").removeClass("find-retail").addClass("ser-again");
                            } else {
                                $("#closest-retailer .retailer").html("");
                                $("#closest-retailer .progress").removeClass("done");
                                $("#closest-retailer .buttons a").removeClass("ser-again").addClass("find-retail");
                            }
                        } else { $("#closest-retailer .buttons a").removeClass("ser-again").addClass("find-retail"); }
                        //Title
                        $("#projects h2").html($(xmlData).find('ProjectTitle').text());
                        $("#project-container #projects .proj-edit").show(); //If saving new title, this link would be hidden - so show it
                        //ToDo text
                        $("#todo").html("To do: " + NEXTSTEP_CODES[nextStepCode]);
                        //Print button
                        if (showPrint) { $(".print-shop-list").show(); } else { $(".print-shop-list").hide(); }
                        break; //case "pageProject"

                    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////         
                    //Update the dock: Scrapbook page         
                    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////         
                    case "pageScrapbook":
                        ////Returned XML will have all nodes for initial load, and only the changed nodes for anything else.. so easiest way is to simply scan for all known node types and update relevant HTML where a node exists
                        //Colours tab
                        coloursNode = $(xmlData).find('Colours');
                        if (coloursNode.length > 0) {
                            $('#scrapbookColoursTab').html("");
                            currentPage = coloursNode.attr('CurrentPage');
                            maxPages = coloursNode.attr('MaxPageCount');
                            coloursNode.find('Colour').each(function () {
                                $("<div class='color-swatch addable removeable' data='[ItemType=1][ItemID=" + $(this).attr('ColourID') + "][R=" + $(this).attr('R') + "][G=" + $(this).attr('G') + "][B=" + $(this).attr('B') + "]'><div class='tile-color' style='background-color:" + num2hex([$(this).attr('R'), $(this).attr('G'), $(this).attr('B')]) + ";'></div><p class='color-code'>" + $(this).attr('SpecifierNumber') + "</p><p class='color-name'>" + $(this).attr('Name') + "</p><a href='javascript:;' class='remover' onclick='compileRequestDelete(\"pageScrapbook\", 1, " + $(this).attr('ItemID') + ", " + currentPage + ");'>Remove</a></div>").appendTo('#scrapbookColoursTab');
                            });
                            $(paginationHTML(1, currentPage, maxPages)).appendTo('#scrapbookColoursTab');
                        }
                        //Schemes tab
                        schemesNode = $(xmlData).find('Schemes');
                        if (schemesNode.length > 0) {
                            $('#scrapbookSchemesTab').html("");
                            currentPage = schemesNode.attr('CurrentPage');
                            maxPages = schemesNode.attr('MaxPageCount');
                            schemesNode.find('Scheme').each(function () {
                                reds = [];
                                greens = [];
                                blues = [];
                                i = 0;
                                $(this).find('Colour').each(function () {
                                    reds[i] = $(this).attr('R');
                                    greens[i] = $(this).attr('G');
                                    blues[i] = $(this).attr('B');
                                    i++;
                                });
                                $("<div class='scheme addable removeable' data='[ItemType=3][ItemID=" + $(this).attr('SchemeID') + "][R1=" + reds[0] + "][G1=" + greens[0] + "][B1=" + blues[0] + "][R2=" + reds[1] + "][G2=" + greens[1] + "][B2=" + blues[1] + "][R3=" + reds[2] + "][G3=" + greens[2] + "][B3=" + blues[2] + "]'><div class='tile-color' style='background-color:" + num2hex([reds[0], greens[0], blues[0]]) + ";'></div><div class='tile-color' style='background-color:" + num2hex([reds[1], greens[1], blues[1]]) + ";'></div><div class='tile-color' style='background-color:" + num2hex([reds[2], greens[2], blues[2]]) + ";'></div><a href='javascript:;' class='remover' onclick='compileRequestDelete(\"pageScrapbook\", 3, " + $(this).attr('ItemID') + ", " + currentPage + ");'>Remove</a></div>").appendTo('#scrapbookSchemesTab');
                            });
                            $(paginationHTML(3, currentPage, maxPages)).appendTo('#scrapbookSchemesTab');
                        }
                        //Images tab
                        imagesNode = $(xmlData).find('Images');
                        if (imagesNode.length > 0) {
                            $('#scrapbookImagesTab').html("");
                            currentPage = imagesNode.attr('CurrentPage');
                            maxPages = imagesNode.attr('MaxPageCount');
                            imagesNode.find('Image').each(function () {
                                $("<div class='scrap-img non-addable removeable'><img src='" + $(this).find('ThumbImage').text() + "' alt='' /><a href='javascript:;' class='remover' onclick='compileRequestDelete(\"pageScrapbook\", 4, " + $(this).attr('ItemID') + ", " + currentPage + ");'>Remove</a></div>").appendTo('#scrapbookImagesTab');
                            });
                            $(paginationHTML(4, currentPage, maxPages)).appendTo('#scrapbookImagesTab');
                        }
                        //Products tab
                        productsNode = $(xmlData).find('Products');
                        if (productsNode.length > 0) {
                            $('#scrapbookProductsTab').html("");
                            currentPage = productsNode.attr('CurrentPage');
                            maxPages = productsNode.attr('MaxPageCount');
                            productsNode.find('Product').each(function () {
                                $("<div class='scrap-prod addable removeable clearfix' data='[ItemType=2][ItemID=" + $(this).attr('ProductID') + "]'><div class='img'><img src='" + $(this).find('ProductThumbImage').text() + "'></div><p class='prod-name'>" + $(this).find('ProductName').text() + "</p><!--p class='prod-desc'>description</p--><a href='javascript:;' class='remover' onclick='compileRequestDelete(\"pageScrapbook\", 2, " + $(this).attr('ItemID') + ", " + currentPage + ");'>Remove</a></div>").appendTo('#scrapbookProductsTab');
                            });
                            $(paginationHTML(2, currentPage, maxPages)).appendTo('#scrapbookProductsTab');
                        }
                        ////Videos tab
                        videosNode = $(xmlData).find('Videos');
                        if (videosNode.length > 0) {
                            $('#scrapbookVideosTab').html("");
                            currentPage = videosNode.attr('CurrentPage');
                            maxPages = videosNode.attr('MaxPageCount');
                            videosNode.find('Video').each(function () {
                                $("<div class='scrap-vid non-addable removeable'><a class='player' href='" + $(this).find('VideoFile').text() + "' rel='shadowbox'><img src='" + $(this).find('ThumbImage').text() + "' alt='' /></a><p class='vid-name'>" + $(this).find('Name').text() + "</p><a href='javascript:;' class='remover' onclick='compileRequestDelete(\"pageScrapbook\", 5, " + $(this).attr('ItemID') + ", " + currentPage + ");'>Remove</a></div>").appendTo('#scrapbookVideosTab');
                            });
                            $(paginationHTML(5, currentPage, maxPages)).appendTo('#scrapbookVideosTab');
                        }
                        activateAddables(); //The addable elements need to be re-activated after loading

                        Shadowbox.setup('.scrap-vid a.player', { player: 'flv' }); //re-initialise the shadowbox player for playing dynamically added videos

                        itemCount = parseInt($(xmlData).find('TotalCount').text());
                        if (itemCount) {
                            //Show the print / empty scrapbook elements
                            $('#scrapbook-body .top-nav a').show();
                        } else {
                            //Hide the print / empty scrapbook elements
                            $('#scrapbook-body .top-nav a').hide();
                        }
                        break; //case "pageScrapbook"
                } //switch(target)

                //invoke message display function
                showSystemAlerts(statusCode, messageCode, nextStepCode);
                logg("HTML updated!");
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                logg("DEBUG: ERROR: " + errorThrown + " " + textStatus); //IE seems to return this error, when it can't find the XML file, whereas other browsers seem to return this ONLY when the XML format is bad
            },
            complete: function () {
                doOverlay("hide"); //Re-enable page interaction, on both XML success and error
                logg("complete XML receive " + target);
            }
        });
    } catch (err) { //Need to catch errors in cases like server not available
        logg("DEBUG: General AJAX error");
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////Facebook methods
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function CreateFacebookPoll(e) {
    e.preventDefault();
    $('#fbpollcontainer span.error').remove();
    if ($('#fbpollProjectName').val().length > 0) {
        window.open($('#fbpolllink').attr('href') + "&project=" + $('#fbpollProjectName').val(), 'facebookpoll', 'status=1');
    } else {
        $('#fbpolllink').after('<span class="error">Please enter a project name.</span>');
    }
}

function AddFacebookPollLinks(colourData) {

    //deactivate until poll is ready to go.
    return '';

    var pollUrl = FB_POLL_URL;
    var pollText = '';
    var itemNumber = 1;
    var fbContent;

    // make sure they've chosen three colours.
    if($(colourData).size() == 3) {
        $(colourData).each(function (e) {
            pollUrl += '&chip' + itemNumber + '=' + $(this).attr('ItemID');
            itemNumber += 1;  
        });
        fbContent = 'Type a name for your project below (e.g Bathroom), then click on create poll.<span style="display: block; clear: both; margin-top: 4px;"><input id="fbpollProjectName" type="text" style="width: 120px;" /><a id="fbpolllink" href="' + pollUrl + '">Create poll</a></span>';
    } else {
        var coloursToAdd = 3 - $(colourData).size();
        if(coloursToAdd > 1) {
            pollText = 'Add ' + coloursToAdd + ' more colours to create a facebook poll.';
        } else {
            pollText = 'Add 1 more colour to create a facebook poll.';
        }
        pollUrl = "#";

        fbContent = pollText;
    }

    //var fb = '<span id="fbpollcontainer" style="display: block; clear: both; margin-top: 8px;"><a id="fbpolllink" href="' + pollUrl + '"><img style="float: left; margin-right: 4px;" src="images/facebook-logo-small.png" alt="Facebook logo" />' + pollText + '</a></span>';
    //var imagePath = $('#FBFlashLikeUrl').attr('value').replace('/{0}/Inbound.aspx', '/images/');
    var fb = '<span id="fbpollcontainer"><img src="/images/facebook-logo-small.png" alt="Facebook logo" />' + fbContent + '</span>';
    return fb;
}

function InitializeLike(colourID, yOffset, colourName) {
    //make sure the FB XMLNS properties are in the dom.
    CheckXMLNSAndJS();
    //remove any existing like
    RemoveLike();

    var xmlnsOG = $('html').attr('xmlns:og');
    var xmlnsFB = $('html').attr('xmlns:fb');
    //var fbJS = $('#fbjs');

    if (xmlnsOG == null) $('html').attr('xmlns:og', 'http://opengraphprotocol.org/schema/');
    if (xmlnsFB == null) $('html').attr('xmlns:fb', 'http://www.facebook.com/2008/fbml');
    //if (fbJS == null) $('head').append('<script id="fbjs" type="text/javascript" language="javascript" src="http://connect.facebook.net/en_US/all.js#xfbml=1"></script>');

    $.getScript(FB_SCRIPT_URL, function () {
        CreateLike(colourID, yOffset, colourName);
    });
}

function CheckXMLNSAndJS() {

}

function CreateLike(colourID, yOffset, colourName) {
    var FBFlashLikeUrl = (FB_BASE_URL + "{0}/Inbound.aspx?bmr=1").replace("{0}", colourID);
    var FBLikeImageUrl = (FB_BASE_URL + "{0}/ColourChip.aspx").replace("{0}", colourID);

    //use FBML to generate the FB like
    //var fbLikeDiv = '<div id="fblike"><fb:like href="' + FBFlashLikeUrl + '" layout="button_count" show_faces="false" width="100" send="false" colourscheme="light"></fb:like></div>';
    var fbLikeDiv = '<div id="fblike"><div id="fb-root"></div><fb:like href="' + FBFlashLikeUrl + '" send="false" layout="button_count" width="80" show_faces="false" font=""></fb:like></div>';
    $('body').append(fbLikeDiv);
    FB.XFBML.parse(document.getElementById('fblike'));

    SetLikePosition(yOffset);
    //SetPollPosition();
    var ResetLikePosition = function () { SetLikePosition(yOffset) };

    //bind to window resize to ensure it is in the right spot.
    $(window).bind("resize", ResetLikePosition);
}

function AddFBMetaTags(colourID, colourName) {
    AddMetaTag('fb:app_id', '152413408145592');
    AddMetaTag('og:site_name', 'Dulux.com.au');
    AddMetaTag('og:url', (FB_BASE_URL + '{0}/Inbound.aspx?bmr=1').replace("{0}", colourID));
    AddMetaTag('og:image', (FB_BASE_URL + '{0}/ColourChip.aspx').replace("{0}", colourID));
    AddMetaTag('og:type', 'product');
    AddMetaTag('og:title', colourName + ' on the Dulux Colour Wall');
}

function AddMetaTag(property, content) {
    $('head').append('<meta property="' + property + '" content="' + content + '" />');
}

function SetLikePosition(yOffset) {
    var colourWallOffset = $('p.fbintro').offset();
    var posPlusOffset = parseFloat(colourWallOffset.top) + 89;
    if ($.browser.msie && $.browser.version.substr(0, 1) < 7) {
        //position for IE6
        SetLikeCoords(posPlusOffset - 4 + parseFloat(yOffset), parseFloat(colourWallOffset.left) + 423);
    } else {
        //position for proper browsers
        SetLikeCoords(posPlusOffset + parseFloat(yOffset), parseFloat(colourWallOffset.left) + 423);
    }
}

function SetLikeCoords(top, left) {
    $('#fblike').css("top", top).css("left", left);
}

function RemoveLike() {
    //remove like iframe
    $('#fblike').remove();
}

function ThrowAlert(position) {
    alert("did this - " + position);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function ProcessTrackingXml(xmlData) {

    //TrackingNode
    TrackingNode = $(xmlData).find('Tracking');

    if (TrackingNode.length > 0) {

        Category = $.trim($(xmlData).find('Category').text());
        logg("Category : " + Category);
        Action = $.trim($(xmlData).find('Action').text());
        logg("Action : " + Action);
        ProjectId = $.trim($(xmlData).find('ProjectScrapbookId').text());
        logg("ProjectId : " + ProjectId);

        ItemsNode = $(xmlData).find('ItemsToTrack');

        logg("");

        if (ItemsNode.length > 0) {
            ItemsNode.find('Item').each(function () {
                ItemName = $(this).find('Name').text();
                logg("Item Name : " + ItemName);
                try {
                    logg(typeof pageTracker);
                    pageTracker._trackEvent(Category, Action, Action + '-' + ItemName, parseInt(ProjectId));

                } catch (err) { logg("error tracking"); }
            });
        }

    }

}

function showSystemAlerts(statusCode, messageCode, nextStepCode) {
    ////statusCode: 1=success, 2=error
    if (statusCode == 2) {
        //Want to show all errors except when scrapbook or project do not yet exist.
        if ((messageCode != "MESSAGE_ERROR_NO_PROJECT") && (messageCode != "MESSAGE_ERROR_NO_SCRAPBOOK")) {
            DuluxAlert("error", messageCode);
        }
    } else {
        if (messageCode.indexOf("MESSAGE_SUCCESS_LOADING") == 0) { //Ignore all LOADING messages
        } else if (messageCode == "MESSAGE_SUCCESS_EMPTY_SCRAPBOOK") { //Ignore scrapbook empty messages
        } else if (messageCode.indexOf("MESSAGE_SUCCESS_DELETING") == 0) { //Ignore all DELETING messages (there is enough visual feedback anyway)
        } else if ((messageCode.indexOf("MESSAGE_SUCCESS_SAVING") == 0) && (isProjectScrapbookPage)) { //Ignore all SAVING messages for project page (there is enough visual feedback anyway)
        } else if (droppedZone.indexOf("dockZoneScrapbook") == 0) { //Ignore SAVING messages for scrapbook dock
        } else if (showPrompt && isNewProject) { //Any item added for first time ever - for new projects
            DuluxAlert("itemProjectFirstTime", messageCode, nextStepCode);
        } else { //Show all other messages
            if (showPrompt) { DuluxAlert("itemProject", messageCode, nextStepCode); } //showPrompt is a node in XML returned from web service. It determines the first time showing of the prompts
        }
    }
}

function paginationHTML(itemType, currentPage, maxPages) {
    nextPage = parseInt(currentPage) + 1;
    prevPage = parseInt(currentPage) - 1;
    pagination = "<ul class='tab-nav'>";
    if (maxPages > currentPage) { pagination = pagination + "<li class='next'><a href='javascript:compileRequestScrapbookSelectpage(" + itemType + ", " + nextPage + ");'>Next Page</a></li>"; }
    for (p = maxPages; p > 0; p--) {
        active = (currentPage == p) ? " class='active'" : "";
        pagination = pagination + "<li" + active + "><a href='javascript:compileRequestScrapbookSelectpage(" + itemType + ", " + p + ");'>" + p + "</a></li>";
    }
    if (currentPage > 1) { pagination = pagination + "<li class='prev'><a href='javascript:compileRequestScrapbookSelectpage(" + itemType + ", " + prevPage + ");'>Previous Page</a></li>"; }
    pagination = pagination + "</ul>"
    return pagination;
}

function doOverlay(action) {
    ////Show/hide the overlay during server communications - to prevent other page interaction at the same time.
    //Mode: "show", "hide", "timed"
    if (action == "show") {
        $("#waitoverlay").show();
        //logg("overlay on");
    } else if (action == "hide") {
        $("#waitoverlay").hide();
        setPageCursor("auto");
        //logg("overlay off");
    } else {
        $("#waitoverlay").show();
        //logg("overlay on");
        setTimeout("doOverlay('hide');", serverTimeout); //Apply timeout to hide overlay
    }
}











////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////ALERTS AND MESSAGES
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function DuluxAlert(type, messageCode, nextStepCode) {
    ////type: project|error|itemProject|itemProjectFirstTime|itemScrapbook|okCancel ... "project" when starting in project page, "itemXxxx" when items are added deleted etc, "error" for error messages, "okCancel" for a prompt that contains ok / cancel buttons and message
    //check if an overlay is already displayed... if so, return false
    if ($("#overlay-container").length > 0) return false;

    var overlayOpacity = 0.5;
    var topEl = $("form");
    var overlay = $("<div style='position:fixed; top:0; left:0; width:100%; height:100%; background-color:#000000'></div>");
    //Set the HTML for the alert below
    switch (type) {
        case "project":
            alertBox = $(getAlertProjectPageHTML());
            break;
        case "error":
            alertBox = $(getAlertErrorHTML(messageCode));
            break;
        case "itemProjectFirstTime":
            alertBox = $(getAlertItemProjectFirstTimeHTML(messageCode, nextStepCode));
            break;
        case "itemProject":
            alertBox = $(getAlertItemProjectHTML(messageCode, nextStepCode));
            break;
        case "okCancel":
            alertBox = $(getAlertOkCancelPromptHTML());
            break;
        default: //No valid type has been provided, exit the function
            return false;
    }
    alertBox.css("position", "absolute");
    alertBox.find(".closeAlert").click(function () {
        closeAlert();
    })
    topEl.append(overlay);
    topEl.append(alertBox);
    sIFR.replace(futura, {
        selector: '#overlay-container h1',
        css: '.sIFR-root { font-weight:bold; color: #2d2d2d;}',
        wmode: 'transparent'
    });
    repositionAlert();
    overlay.css("opacity", 0);
    overlay.animate({ opacity: overlayOpacity }, animateSpeed);

    function repositionAlert() {
        var left = ($(window).width() - alertBox.width()) / 2 + $(window).scrollLeft();
        alertBox.css("left", left);
        var minTop = Math.min(left, ($(window).height() - alertBox.height()) / 2 + $(window).scrollTop());
        alertBox.css("top", minTop);
    }
    $(window).resize(function () { repositionAlert(); });
    $(window).scroll(function () { repositionAlert(); });
    function closeAlert() {
        alertBox.remove();
        function closeFinish() {
            overlay.remove();
        }
        overlay.animate({ opacity: 0 }, animateSpeed, "linear", closeFinish);
    }
}

function okCancelPrompt(msg, urlOk, urlCancel, hideClose) {
    promptCustomMessage = msg;
    if (!urlOk) { promptOkURL = ""; } else { promptOkURL = urlOk }
    if (urlCancel == null) { promptCancelURL = null } else { if (!urlCancel) { promptCancelURL = ""; } else { promptCancelURL = urlCancel } }
    promptHideClose = hideClose;
    DuluxAlert("okCancel");
}

function getAlertProjectPageHTML() {
    logg('ALERT:Project');
    var html = '' +
	'<div id="overlay-container" class="alert-nextstep">' +
		'<div id="overlay-head"><a class="closeAlert" href="javascript:;">Close</a></div>' +
		'<div id="body-container">' +
			'<div id="overlay-body">' +
				'<span class="previous" href="#">Previous</span>' +
				'<div id="overlay-proj">' +
					'<img src="/css/imgs/head_your-proj.png" alt="This is your project" />' +
					'<p>My Project is the perfect tool to help you plan for any painting occasion, big or small. Use our range of interactive tools to help you find the right colours and products, calculate the amount of paint you\'ll need, find your closest retailer and create a custom shopping list for you to take in-store. </p>' +
				'</div>' +
				'<div id="overlay-scrapbook">' +
					'<img src="/css/imgs/head_your-scrap.png" alt="This is your scrapbook" />' +
					'<p>As you browse the Dulux website you can drag items of interest, including images, colours and videos, into your scrapbook, You can share it or simply register to save it for future reference.</p>' +
				'</div>' +
				'<span class="next" href="#">Next</span>' +
				'<div class="clear"></div>' +
				'<img src="/css/imgs/overlay-dog.jpg" alt="" class="dog" />' +
				'<div id="divider"></div>' +
				'<a href="javascript:;" class="start closeAlert">Start a project</a>' +
				'<div class="clear"></div>' +
			'</div>' +
		'</div>' +
		'<div id="overlay-bottom">' +
			'<div id="overlay-bottom-stretch"></div>' +
		'</div>' +
	'</div>';
    return html;
}

function getAlertErrorHTML(messageCode) {
    logg('ALERT:Error, ' + messageCode);
    logg("=" + MESSAGE_CODES[messageCode]);
    var html = '' +
	'<div id="overlay-container" class="alert-productadd">' +
		'<div id="overlay-head"><a class="closeAlert" href="javascript:;">Close</a></div>' +
		'<div id="body-container">' +
			'<div id="overlay-body">' +
				'<h1>Alert</h1>' +
				'<p class="overlay-login">' + MESSAGE_CODES[messageCode] + '.</p>' +
				'<div class="clear"></div>  ' +
			'</div>' +
		'</div>' +
		'<div id="overlay-bottom">' +
			'<div id="overlay-bottom-stretch"></div>' +
		'</div>' +
	'</div>';
    return html;
}

function getAlertItemProjectFirstTimeHTML(messageCode, nextStepCode) {
    logg('ALERT:itemProjectFirstTime, ' + messageCode + ', ' + nextStepCode);
    logg("=" + MESSAGE_CODES[messageCode] + ", " + NEXTSTEP_CODES[nextStepCode]);
    var html = '' +
	'<div id="overlay-container" class="alert-created">' +
		'<div id="overlay-head"><a class="closeAlert" href="javascript:;">Close</a></div>' +
		'<div id="body-container">' +
			'<div id="overlay-body">' +
				'<h1>' + MESSAGE_CODES[messageCode] + ' and created a project.</h1>' +
				'<p>My Project is a tool created to help you help you through every step of any painting job. It is designed to prompt you through the painting process.</p>' +
				'<ul>' +
					'<li>You can start by dragging colours from the Colour Galleries</li>' +
					'<li>Our MyColour tool means you can try thousands of colour combinations on your home.</li>' +
					'<li>Browse our product range to meet your every need.</li>' +
					'<li>Use our Paint Calculator to get an idea of how much paint you\'ll need and find a retailer in your local area.</li>' +
				'</ul>' +
				'<p>Next step:</p>' +
				'<a href="' + NEXTSTEP_URLS[nextStepCode] + '" class="btn closeAlert ' + NEXTSTEP_BUTTONS[nextStepCode] + '">' + NEXTSTEP_CODES[nextStepCode] + '.</a>' +
				'<div class="clear"></div>';
    if (!userLoggedIn) {
        html = html + '<p class="overlay-login">Remember to <a href="/site-tools/log-in.aspx">login</a> or <a href="/site-tools/register.aspx">register</a> to save your project</p>';
    } else {
        html = html + '';
    }
    html = html + '<p>To plan your entire project, view <a href="/my-project.aspx">My Project</a>.</p>' +
				'<div class="clear"></div>' +
			'</div>' +
		'</div>' +
		'<div id="overlay-bottom">' +
			'<div id="overlay-bottom-stretch"></div>' +
		'</div>' +
	'</div>';
    return html;
}

function getAlertItemProjectHTML(messageCode, nextStepCode) {
    logg('ALERT:itemProject, ' + messageCode + ', ' + nextStepCode);
    logg("=" + MESSAGE_CODES[messageCode] + ", " + NEXTSTEP_CODES[nextStepCode]);
    var html = '' +
	'<div id="overlay-container" class="alert-productadd">' +
		'<div id="overlay-head"><a class="closeAlert" href="javascript:;">Close</a></div>' +
		'<div id="body-container">' +
			'<div id="overlay-body">' +
				'<h1>' + MESSAGE_CODES[messageCode] + '.</h1>' +
				'<p>Next step:</p>' +
				'<a href="' + NEXTSTEP_URLS[nextStepCode] + '" class="btn closeAlert ' + NEXTSTEP_BUTTONS[nextStepCode] + '">' + NEXTSTEP_CODES[nextStepCode] + '.</a>' +
				'<div class="clear"></div>';
    if (showPrint) { html = html + '<p>or:</p><a href="/my-project/print-project.aspx" class="btn overlay-print" target="_blank">Print your shopping list</a>'; }
    if (!userLoggedIn) {
        html = html + '<p class="overlay-login">Remember to <a href="/site-tools/log-in.aspx">login</a> or <a href="/site-tools/register.aspx">register</a> to save your project.<br>To plan your entire project, <a href="/my-project.aspx">view My Project</a>.</p>';
    } else {
        html = html + '<p class="overlay-login">To plan your entire project, <a href="/my-project.aspx">view My Project</a>.</p>';
    }
    html = html + '<div class="clear"></div>' +
			'</div>' +
		'</div>' +
		'<div id="overlay-bottom">' +
			'<div id="overlay-bottom-stretch"></div>' +
		'</div>' +
	'</div>';
    return html;
}

function getAlertOkCancelPromptHTML() {
    logg('ALERT:OkCancelPrompt');
    var html = '' +
	'<div id="overlay-container" class="alert-generic">' +
		'<div id="overlay-head">';
    if (!promptHideClose) { html = html + '<a class="closeAlert" href="javascript:;">Close</a>'; }
    html = html + '</div>' +
		'<div id="body-container">' +
			'<div id="overlay-body">' +
				'<p>' + promptCustomMessage + '</p>';
    if (promptOkURL != "") {
        html = html + '<a href="' + promptOkURL + '" class="btn ok">Ok</a>';
        if (promptCancelURL != null) {
            if (promptCancelURL != "") { html = html + '<a href="' + promptCancelURL + '" class="btn cancel">Cancel</a>'; } else { html = html + '<a href="javascript:;" class="closeAlert btn cancel">Cancel</a>'; }
        }
    } else {
        html = html + '<a href="javascript:;" class="closeAlert btn ok">Ok</a>';
        if (promptCancelURL != null) {
            if (promptCancelURL != "") { html = html + '<a href="' + promptCancelURL + '" class="btn cancel">Cancel</a>'; }
        }
    }
    html = html + '<div class="clear"></div>  ' +
			'</div>' +
		'</div>' +
		'<div id="overlay-bottom">' +
			'<div id="overlay-bottom-stretch"></div>' +
		'</div>' +
	'</div>';
    return html;
}











////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////MISC STUFF
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function preloadImages() {
    ////Preload images -- usage: preloadImages("image1.gif", "/path/to/image2.png","some/image3.jpg");
    for (var i = 0; i < arguments.length; i++) {
        myimg = $("<img>").attr("src", arguments[i]);
        myimg.appendTo("#preloadedImages");
    }
}

function hex2num(hex) {
    ////hex2num("#0FCAF8") will return [15,202,248]
    if (hex.charAt(0) == "#") hex = hex.slice(1); //Remove the '#' char - if there is one.
    hex = hex.toUpperCase();
    var hex_alphabets = "0123456789ABCDEF";
    var value = new Array(3);
    var k = 0;
    var int1, int2;
    for (var i = 0; i < 6; i += 2) {
        int1 = hex_alphabets.indexOf(hex.charAt(i));
        int2 = hex_alphabets.indexOf(hex.charAt(i + 1));
        value[k] = (int1 * 16) + int2;
        k++;
    }
    return (value);
}

function num2hex(triplet) {
    ////num2hex([15,202,248]) will return string #0FCAF8
    var hex_alphabets = "0123456789ABCDEF";
    var hex = "#";
    var int1, int2;
    for (var i = 0; i < 3; i++) {
        int1 = triplet[i] / 16;
        int2 = triplet[i] % 16;
        hex += hex_alphabets.charAt(int1) + hex_alphabets.charAt(int2);
    }
    return (hex);
}

function getTextColourForRGB(R, G, B) {
    threshold = 175;
    return (Math.round(Math.sqrt(R * R * .241 + G * G * .691 + B * B * .068)) < threshold) ? "#FFF" : "#000";
}

function setPageSelectable(active) {
    ////Prevents page/text etc selections when mouse is dragged. Needed to prevent selections when dragged is being moved about.
    if (typeof document.body.onselectstart != "undefined") { //IE 
        document.body.onselectstart = function () { return active; }
    } else if (typeof document.body.style.MozUserSelect != "undefined") { //Firefox... note that this is still buggy when dragging dragged from a SWF
        document.body.style.MozUserSelect = (active) ? "" : "none";
    } else { //All other route
        document.body.onmousedown = function () { return active; }
    }
}

function logg(text) {
    ////Debugging purposes only
    if ($("#logg").length > 0) { //ie if #logg exists
        $("#logg").append(text + "<br>");
        $("#logg").attr({ scrollTop: $("#logg").attr("scrollHeight") }); //Scroll to bottom
    }
}

function initShadowbox() {
    ////Initialise Shadowbox
    Shadowbox.init({
        players: ["flv", "img", "swf", "iframe"]
    });
    logg('Shadowbox initialised');

    
}

initShadowbox();

$(function() {
    //load world of colour video.
    $("map#wocmap area.video").shadowbox({width: 436, height: 346});
});

////LI:hover support for IE6
if ($.browser.msie && $.browser.version <= 6) {
    sfHover = function () {
        var sfEls = document.getElementById("nav").getElementsByTagName("LI");
        for (var i = 0; i < sfEls.length; i++) {
            sfEls[i].onmouseover = function () {
                this.className += " sfhover";
            }
            sfEls[i].onmouseout = function () {
                this.className = this.className.replace(new RegExp(" sfhover\\b"), "");
            }
        }
    }
    if (window.attachEvent) window.attachEvent("onload", sfHover);
}

















////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////COOKIE PLUGIN jquery.cookie.js
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
* Cookie plugin
*
* Copyright (c) 2006 Klaus Hartl (stilbuero.de)
* Dual licensed under the MIT and GPL licenses:
* http://www.opensource.org/licenses/mit-license.php
* http://www.gnu.org/licenses/gpl.html
*
*/

/**
* Create a cookie with the given name and value and other optional parameters.
*
* @example $.cookie('the_cookie', 'the_value');
* @desc Set the value of a cookie.
* @example $.cookie('the_cookie', 'the_value', { expires: 7, path: '/', domain: 'jquery.com', secure: true });
* @desc Create a cookie with all available options.
* @example $.cookie('the_cookie', 'the_value');
* @desc Create a session cookie.
* @example $.cookie('the_cookie', null);
* @desc Delete a cookie by passing null as value. Keep in mind that you have to use the same path and domain
*	   used when the cookie was set.
*
* @param String name The name of the cookie.
* @param String value The value of the cookie.
* @param Object options An object literal containing key/value pairs to provide optional cookie attributes.
* @option Number|Date expires Either an integer specifying the expiration date from now on in days or a Date object.
*							 If a negative value is specified (e.g. a date in the past), the cookie will be deleted.
*							 If set to null or omitted, the cookie will be a session cookie and will not be retained
*							 when the the browser exits.
* @option String path The value of the path atribute of the cookie (default: path of page that created the cookie).
* @option String domain The value of the domain attribute of the cookie (default: domain of page that created the cookie).
* @option Boolean secure If true, the secure attribute of the cookie will be set and the cookie transmission will
*						require a secure protocol (like HTTPS).
* @type undefined
*
* @name $.cookie
* @cat Plugins/Cookie
* @author Klaus Hartl/klaus.hartl@stilbuero.de
*/

/**
* Get the value of a cookie with the given name.
*
* @example $.cookie('the_cookie');
* @desc Get the value of a cookie.
*
* @param String name The name of the cookie.
* @return The value of the cookie.
* @type String
*
* @name $.cookie
* @cat Plugins/Cookie
* @author Klaus Hartl/klaus.hartl@stilbuero.de
*/
jQuery.cookie = function (name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        // CAUTION: Needed to parenthesize options.path and options.domain
        // in the following expressions, otherwise they evaluate to undefined
        // in the packed version for some reason...
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};
















/*
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////NOTES
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

ITEMTYPE IDs
0 NoType
1 Colour
2 Product
3 Scheme
4 Image
5 Video
6 MyColour
7 Calculation
8 Retailer
9 ReceiptNumber
10 Title
11 ColourCollection
*/