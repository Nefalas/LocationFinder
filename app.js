// If the app is connected to the server
var isConnected = false;

// Request variables
var password = "P5SVOrohQpa36cv"; // Password for sending requests to the server, must match password set on server
var myLocation; // Location variable
var isBusy; // Availability boolean

// If first connection
var firstConnection = true;

// Used for displaying friend list
var friendStatusList = [];

//localStorage.friends = "{}"; // Used for emptying friends object

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Default page
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Getting things started
function main() {
    checkIfIpSet();

    app.initialize();

    buttonSetup();

    getJSON(localStorage.ip, getMyStatus);
    fillFriendList();
    setTimeout(displayFriendList, 5 * 1000); // Fill list with the first connected friends
    setInterval(function() {getJSON(localStorage.ip, getMyStatus)}, 10 * 1000);
    setInterval(fillFriendList, 10 * 1000);
}

// Adding eventListeners to the buttons
function buttonSetup() {
    // Changing stored IP
    var changeMyIp = document.getElementById("changeMyIp");
    changeMyIp.addEventListener("click", function() {
        document.getElementById("ip").value = localStorage.ip;
        $("#ipAskBox").show();
        $("#optionBox").hide();
    });

    // Access beacon management page
    var manageBeacons = document.getElementById("manageBeacons");
    manageBeacons.addEventListener("click", function() {
        $("#page-default").hide();
        $("#page-manageBeacons").show();
    });

    // Back to main page from beacon management page
    var backToMain = document.getElementById("backToMain");
    backToMain.addEventListener("click", function() {
        $("#page-manageBeacons").hide();
        $("#page-default").show();
    });

    // Add friend
    var friendName = document.getElementById("friendName");
    var friendIP = document.getElementById("friendIP");

    var addFriendButton = document.getElementById("addFriendButton");
    addFriendButton.addEventListener("click", function() {
        $("#addFriendAskBox").show();
    });

    var cancelFriend = document.getElementById("cancelFriend");
    cancelFriend.addEventListener('click', function() {
        $("#addFriendAskBox").hide();
        friendName.value = "";
        friendIP.value = "";
    });

    var addFriend = document.getElementById("addFriend");
    addFriend.addEventListener("click", function() {
        if (friendName.value && friendIP.value) {
            saveFriend(friendName.value, friendIP.value);
            $("#addFriendAskBox").hide();
            friendName.value = "";
            friendIP.value = "";
        }
    });
}

// Fetching data from the server
function getJSON(ip, callback) {
    if (window.cordova) {
        cordovaHTTP.get(
            ip,
            function (response) { // If the connection is established
                isConnected = true;
                setConnectedStatus(isConnected);
                callback(JSON.parse(response.data))
            },
            function (error) { // If the connection failed
                isConnected = false;
                setConnectedStatus(isConnected);
                hyper.log(JSON.stringify(error));
            }
        );
    } else { // If the cordova plugin is not present
        hyper.log("Cordova plugin not found")
    }
}

// Fetching user status from the server, used as a callback function in getJSON()
function getMyStatus(status) {
    var myStatus = document.getElementById("myStatus");
    var availability;

    // Getting server availability status on first connection
    if (firstConnection) {
        if (status.isBusy) {
            isBusy = true;
        } else if (!status.isBusy) {
            isBusy = false;
        }
        firstConnection = false;
    }

    // Setting availability status
    if (isBusy) {
        availability = "busy";
    } else {
        availability = "available";
    }

    // If location is empty or not set, set it to unknown
    if (!myLocation || myLocation == "" || location == "Not set") {
        myLocation = "unknown";
    }

    // Changing HTML content of the user status box matching fetched data
    myStatus.innerHTML = "<p>My location is <b>" + myLocation + "</b></p>" +
        "<p>My status is <button id='availability'><b>" + availability + "</b></button></p>";

    // Sending new location if current location is different than server location
    if (status.location != myLocation) {
        setMyStatus(localStorage.ip, password, myLocation, isBusy);
    }

    // Setting availability button status
    setAvailabilityButtonStatus(isBusy);

    // Sending new status to server if the availability button is clicked
    var availabilityButton = document.getElementById("availability");
    availabilityButton.addEventListener("click", function() {
        if (isConnected) {
            isBusy = !isBusy; // Changing isBusy state
            setAvailabilityButtonStatus(isBusy);
            setMyStatus(localStorage.ip, password, myLocation, isBusy)
        }
    })
}

// Sending user status to the server
function setMyStatus(ip, password, location, isBusy) {
    if (isBusy) {
        location = "hidden"; // Setting location to hidden if busy
    } else if (location == "" || location == "Not set") {
        location = "unknown"; // If location string empty, set it to unknown
    }
    if (window.cordova) { // if the cordova plugin is present
        cordovaHTTP.get(
            ip + "?password=" + password + "&location=" + location + "&isBusy=" + isBusy, // Send status to server via GET request
            function(response) {},
            function(error) {}
        )
    }
    // Fetching data from the server so that displayed status matches server status, waiting to give time to the server to update
    setTimeout(function() {getJSON(localStorage.ip, getMyStatus)}, 200);
}

// Changing state of the availability button
function setAvailabilityButtonStatus(isBusy) {
    var availabilityButton = document.getElementById("availability");
    if (isBusy) {
        availabilityButton.style.background = "background: rgb(255, 5, 0)";
        availabilityButton.innerHTML = "<b>busy</b>";
    } else {
        availabilityButton.style.background = "rgb(62, 255, 37)";
        availabilityButton.innerHTML = "<b>available</b>";
    }
}

// Displaying if the app is connected to the server
function setConnectedStatus(isConnected) {
    var connectStatus = document.getElementById("connectStatus");
    if (isConnected) {
        connectStatus.innerHTML = "<b>Connected</b>";
    } else {
        connectStatus.innerHTML = "<b>Disconnected</b>";
    }
}

// Save IP entered in IP textbox into localStorage
function saveIP() {
    var ipBox = document.getElementById("ip");
    localStorage.ip = ipBox.value;
    checkIfIpSet()
}

// Checking if IP saved into localStorage, showing IP textbox if not
function checkIfIpSet() {
    if (!localStorage.ip) {
        $("#ipAskBox").show();
        $("#optionBox").hide();
    } else {
        $("#ipAskBox").hide();
        $("#optionBox").show();
    }
}

function saveFriend(name, ip) {
    var friendList = JSON.parse(localStorage.friends);
    friendList[name] = ip;
    localStorage.friends = JSON.stringify(friendList);
}

function displayFriendList() {

    $('#friendList').empty();

    for (var i = 0; i < friendStatusList.length; i++) {

        var element;
        var name = friendStatusList[i][0];

        if (friendStatusList[i][1] == false) {

            element = $(
                '<li>'
                + '<b>Name: ' + name + '</b><br /><br />'
                + 'There was an error with the request<br />'
                + '</li><br />'
            );

        } else {

            var location = friendStatusList[i][1];
            var isBusy = friendStatusList[i][2];

            var availability;
            if (isBusy) {
                availability = "busy";
            } else if (!isBusy) {
                availability = "available";
            } else {
                availability = "unknown";
            }

            element = $(
                '<li>'
                + '<b>Name: ' + name + '</b><br /><br />'
                + 'Status: <b>' + availability + '</b><br />'
                + 'Location: <b>' + location + '</b>'
                + '</li><br />'
            );
        }

        $('#friendList').append(element);
    }
}

function fillFriendList() {

    friendStatusList = [];

    var friends = JSON.parse(localStorage.friends);

    for (var name in friends) {
        fetchFriend(name)
    }

    function fetchFriend(name) {
        if (friends.hasOwnProperty(name)) {
            // Adding friend name in separate array
            var ip = JSON.parse(localStorage.friends)[name];
            cordovaHTTP.get(
                ip,
                function(response) {
                    var status = JSON.parse(response.data);
                    friendStatusList.push([name, status.location, status.isBusy]);
                    // If the list is complete, call displayFriendList to update list
                    if (friendStatusList.length == Object.keys(friends).length) {
                        displayFriendList();
                    }
                },
                function(error) {
                    hyper.log(JSON.stringify(error));
                    friendStatusList.push([name, false]);
                    // If the list is complete, call displayFriendList to update list
                    if (friendStatusList.length == Object.keys(friends).length) {
                        displayFriendList();
                    }
                }
            )
        }
    }
}

// Checking if cordova is present and calling main() once the device is ready
if (window.cordova) {
    document.addEventListener("deviceready", main, false);
} else {
    hyper.log("Cordova plugin not found")
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Manage Beacons page
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var app = (function()
{
    // Application object.
    var app = {};

    // Specify your beacon 128bit UUIDs here.
    var regions =
        [
            // Estimote Beacon factory UUID.
            {uuid:'B9407F30-F5F8-466E-AFF9-25556B57FE6D'},
            /*
             // Sample UUIDs for beacons in our lab.
             {uuid:'F7826DA6-4FA2-4E98-8024-BC5B71E0893E'},
             {uuid:'8DEEFBB9-F738-4297-8040-96668BB44281'},
             {uuid:'A0B13730-3A9A-11E3-AA6E-0800200C9A66'},
             {uuid:'E20A39F4-73F5-4BC4-A12F-17D1AD07A961'},
             {uuid:'A4950001-C5B1-4B44-B512-1370F02D74DE'},
             {uuid:'585CDE93-1B01-42CC-9A13-25009BEDC65E'}	// Dialog Semiconductor.
             */
        ];

    // Dictionary of beacons.
    var beacons = {};

    // Timer that displays list of beacons.
    var updateTimer = null;

    app.initialize = function() {
        document.addEventListener(
            'deviceready',
            function() {
                evothings.scriptsLoaded(onDeviceReady)
            },
            false);
    };

    function onDeviceReady() {
        // Specify a shortcut for the location manager holding the iBeacon functions.
        window.locationManager = cordova.plugins.locationManager;

        // Start tracking beacons!
        startScan();

        // Display refresh timer.
        updateTimer = setInterval(displayBeaconList, 500);
    }

    function startScan() {
        // The delegate object holds the iBeacon callback functions
        // specified below.
        var delegate = new locationManager.Delegate();

        // Called continuously when ranging beacons.
        delegate.didRangeBeaconsInRegion = function(pluginResult) {
            //console.log('didRangeBeaconsInRegion: ' + JSON.stringify(pluginResult))
            for (var i in pluginResult.beacons) {
                // Insert beacon into table of found beacons.
                var beacon = pluginResult.beacons[i];
                beacon.timeStamp = Date.now();
                var key = beacon.uuid + ':' + beacon.major + ':' + beacon.minor;
                if (localStorage.getItem(key)) {
                    beacon.location = localStorage.getItem(key);
                } else {
                    beacon.location = "Not set";
                }
                beacons[key] = beacon;
            }
        };

        // Set the delegate object to use.
        locationManager.setDelegate(delegate);

        // Request permission from user to access location info.
        // This is needed on iOS 8.
        locationManager.requestAlwaysAuthorization();

        // Start monitoring and ranging beacons.
        for (var i in regions) {
            var beaconRegion = new locationManager.BeaconRegion(
                i + 1,
                regions[i].uuid);

            // Start ranging.
            locationManager.startRangingBeaconsInRegion(beaconRegion)
                .fail(console.error)
                .done();
        }
    }

    function sortBeaconsByProximity(beacons) {
        var beaconKeyRssiArray = [];
        var sortedBeacons = {};

        for (var key in beacons) {
            beaconKeyRssiArray.push([beacons[key], key, beacons[key].rssi]);
        }

        beaconKeyRssiArray.sort(function(a, b) {
            return b[2] - a[2];
        });

        // Setting my location as the closest beacon location
        if (beaconKeyRssiArray.length > 0 && localStorage.getItem(beaconKeyRssiArray[0][1])) {
            myLocation = localStorage.getItem(beaconKeyRssiArray[0][1]);
        } else {
            myLocation = "unknown";
        }

        if (!isConnected) {
            var myStatus = document.getElementById("myStatus");
            myStatus.innerHTML = "<p>My current location is <b>" + myLocation + "</b></p>" +
                "<p>My current status is <button id='availability'><b>busy</b></button></p>";
        }

        for (var i = 0; i < beaconKeyRssiArray.length; i++) {
            sortedBeacons[beaconKeyRssiArray[i][1]] = beaconKeyRssiArray[i][0];
        }

        return sortedBeacons
    }

    function displayBeaconList() {
        // Clear beacon list.
        $('#found-beacons').empty();

        var timeNow = Date.now();

        // Update beacon list.
        $.each(sortBeaconsByProximity(beacons), function(key, beacon) {
            // Only show beacons that are updated during the last 60 seconds.
            if (beacon.timeStamp + 60000 > timeNow) {
                // Map the RSSI value to a width in percent for the indicator.
                var rssiWidth = 1; // Used when RSSI is zero or greater.
                if (beacon.rssi < -100) {
                    rssiWidth = 100;
                } else if (beacon.rssi < 0) {
                    rssiWidth = - 1 * beacon.rssi;
                }

                var button;
                if (localStorage.getItem(key)) {
                    button = '<button id="' + key + 'remove" class="removeButton"><b>Remove beacon</b></button>'
                } else {
                    button = '<button id="' + key + 'save" class="actionButton"><b>Save beacon</b></button>'
                }

                // Create tag to display beacon data.
                var element = $(
                    '<li>'
                    +   button + '<br />'
                    +   '<span id="beaconLocationName"><strong>Location: ' + beacon.location + '</strong></span><br />'
                    +	'<strong>UUID: ' + beacon.uuid + '</strong><br />'
                    +	'Major: ' + beacon.major + '<br />'
                    +	'Minor: ' + beacon.minor + '<br />'
                    +	'Proximity: ' + beacon.proximity + '<br />'
                    +	'RSSI: ' + beacon.rssi + '<br />'
                    + 	'<div style="background:rgb(255,128,64);height:20px;width:' + rssiWidth + '%;"></div>'
                    +   '</li>'
                    +   '<br />'
                );

                $('#warning').remove();
                $('#found-beacons').append(element);

                var beaconLocation = document.getElementById("beaconLocation");
                var set = document.getElementById("set");

                function storeValue() {
                    localStorage.setItem(key, beaconLocation.value);
                    $("#beaconLocationAskBox").hide();
                    beaconLocation.value = "";
                    set.removeEventListener("click", storeValue);
                }

                if (localStorage.getItem(key)) {
                    var removeBeaconButton = document.getElementById(key + "remove");
                    removeBeaconButton.addEventListener("click", function() {
                        localStorage.removeItem(key);
                    });
                } else {
                    var saveBeaconButton = document.getElementById(key + "save");
                    saveBeaconButton.addEventListener("click", function() {
                        $("#beaconLocationAskBox").show();
                        set.addEventListener("click", storeValue);
                    });
                }

                // Cancel setting beacon location
                var cancel = document.getElementById("cancel");
                cancel.addEventListener("click", function cancelBeaconLocation() {
                    $("#beaconLocationAskBox").hide();
                    beaconLocation.value = "";
                    cancel.removeEventListener("click", cancelBeaconLocation);
                    // Remove eventListener on set that will not be used
                    set.removeEventListener("click", storeValue);
                });

            }
        });
    }


    return app;
})();