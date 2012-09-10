//Constants for all javascripts

//Response messages:
var MESSAGE_CODES = {
    MESSAGE_SUCCESS_SAVING_COLOUR: "You've just added a colour",
    MESSAGE_SUCCESS_SAVING_SCHEME: "You've just added a scheme", //also applies to adding colour collections
    MESSAGE_SUCCESS_SAVING_PRODUCT: "You've just added a product",
    MESSAGE_SUCCESS_SAVING_IMAGE: "You've just added an image",
    MESSAGE_SUCCESS_SAVING_VIDEO: "You've just added a video",
    MESSAGE_SUCCESS_SAVING_CALCULATION: "You've just added a paint calculation",
    MESSAGE_SUCCESS_SAVING_RETAILER: "You've just added a retailer",
    MESSAGE_SUCCESS_SAVING_RECEIPT: "You've just added a receipt number", //Not currently in use
    MESSAGE_SUCCESS_SAVING_PROJECT_TITLE: "You've just renamed your project",
    MESSAGE_SUCCESS_DELETING_COLOUR: "You've just deleted a colour",
    MESSAGE_SUCCESS_DELETING_SCHEME: "You've just deleted a scheme",
    MESSAGE_SUCCESS_DELETING_PRODUCT: "You've just deleted a product",
    MESSAGE_SUCCESS_DELETING_IMAGE: "You've just deleted an image",
    MESSAGE_SUCCESS_DELETING_VIDEO: "You've just deleted a video",
    MESSAGE_SUCCESS_DELETING_CALCULATION: "You've just deleted your paint calculation",
    MESSAGE_SUCCESS_DELETING_RETAILER: "You've just deleted a retailer",
    MESSAGE_SUCCESS_DELETING_RECEIPT: "You've just added a receipt number", //Not currently in use
    MESSAGE_SUCCESS_EMPTY_SCRAPBOOK: "You've just emptied your scrapbook",
    MESSAGE_SUCCESS_LOADING_PROJECT: "Project loaded",
    MESSAGE_SUCCESS_LOADING_SCRAPBOOK: "Scrapbook loaded",
    MESSAGE_ERROR_NO_PROJECT: "Project not found for session",
    MESSAGE_ERROR_NO_SCRAPBOOK: "Scrapbook not found for session",
    MESSAGE_ERROR_FETCHING: "Error fetching data",
    MESSAGE_ERROR_SAVING: "Error saving data",
    MESSAGE_ERROR_DELETING: "Error deleting data",
    MESSAGE_ERROR_INVAILD_DATA: "Error finding data",
    MESSAGE_ERROR_INVAILD_DATA_TYPE: "Error converting data",
    MESSAGE_ERROR_INVAILD_ITEM_TYPE: "Error finding item type",
    MESSAGE_ERROR_MAX_ALLOW_REACHED: "You already have maximum number of items for this type"
};

//Response next steps
var NEXTSTEP_CODES = {
    NEXTSTEP_SCHEME: "Complete your colour scheme",
    NEXTSTEP_VISUALISE: "Visualise your colour scheme",
    NEXTSTEP_PRODUCT: "Select a product",
    NEXTSTEP_CALCULATE: "Calculate your paint requirements",
    NEXTSTEP_RETAILER: "Find your nearest retailer",
    NEXTSTEP_RECEIPT: "Enter a receipt number", //Not currently in use
    NEXTSTEP_FINISHED: "You've now completed your project"
};

//Response next step URLs
var NEXTSTEP_URLS = {
    NEXTSTEP_SCHEME: "/colour/colour-wall.aspx",
    NEXTSTEP_VISUALISE: "/colour/mycolour.aspx",
    NEXTSTEP_PRODUCT: "/products.aspx",
    NEXTSTEP_CALCULATE: "/products/paint-calculator.aspx",
    NEXTSTEP_RETAILER: "/find-a-retailer.aspx",
    NEXTSTEP_RECEIPT: "#", //Not currently in use
    NEXTSTEP_FINISHED: "/my-project.aspx"
};

//Response next step button CSS class names
var NEXTSTEP_BUTTONS = {
    NEXTSTEP_SCHEME: "scheme",
    NEXTSTEP_VISUALISE: "visualise",
    NEXTSTEP_PRODUCT: "product",
    NEXTSTEP_CALCULATE: "calculate",
    NEXTSTEP_RETAILER: "retailer",
    NEXTSTEP_RECEIPT: "", //Not currently in use
    NEXTSTEP_FINISHED: "finished"
};

//Paint Calculator validation messages
var VALID_PC_OUT_OF_RANGE = "Please enter a value from $low$ to $hi$."; // $low$ and $hi$ are replace by the proper values during validation
var VALID_PC_NOT_POSITIVE_NUM = "Please enter a positive number";
var VALID_PC_NOT_POSITIVE_INT = "Please enter positive whole numbers only";


//Other constants
var CONFIRM_SCRAPBOOK_EMPTY = "Are you sure you want to empty your scrapbook";


//Web services calls
var BASE_URL = "http://www.dulux.com.au/umbraco/"; //Base URL for webservice calls
//var BASE_URL = "http://dulux.staging.es-i.com.au/umbraco/"; //Base URL for webservice calls
//var BASE_URL = "http://localhost:99/Dulux.CWFacebook.Like.Web/ColourWallFB/"; //Base URL for webservice calls

var WEBSERVICE_PROJECT_ADDTO = BASE_URL + "myproject/add.ashx"; //?itemId={0}&itemValues={1}&itemTypeId={2}&SessionId={3}&positionID={4}
var WEBSERVICE_PROJECT_DELETEFROM = BASE_URL + "myproject/delete.ashx"; //?itemId={0}&itemTypeId={1}&SessionId={2}
var WEBSERVICE_PROJECT_LOAD = BASE_URL + "myproject/load.ashx"; //?SessionId={0}
var WEBSERVICE_PROJECT_RENAME = BASE_URL + "myproject/add.ashx"; //?SessionId={0}

var WEBSERVICE_SCRAPBOOK_ADDTO = BASE_URL + "myscrapbook/add.ashx"; //?itemId={0}&itemTypeId={1}&SessionId={2}
var WEBSERVICE_SCRAPBOOK_DELETEFROM = BASE_URL + "myscrapbook/delete.ashx"; //?itemId={0}&itemTypeId={1}&SessionId={2}
var WEBSERVICE_SCRAPBOOK_EMPTY = BASE_URL + "myscrapbook/empty.ashx"; //?SessionId={0}
var WEBSERVICE_SCRAPBOOK_SELECTPAGE = BASE_URL + "myscrapbook/select.ashx"; //?itemTypeId={0}&SessionId={1}&PageNum={2}
var WEBSERVICE_SCRAPBOOK_LOAD = BASE_URL + "myscrapbook/load.ashx"; //?SessionId={0}

var FB_BASE_URL = "http://www.dulux.com.au/ColourWallFB/";
var FB_POLL_URL = "http://www.dulux.com.au/DuluxCWFVote/Home.aspx/CreateProject?";
var FB_SCRIPT_URL = 'http://connect.facebook.net/en_US/all.js#appId=163916583677124&xfbml=1';