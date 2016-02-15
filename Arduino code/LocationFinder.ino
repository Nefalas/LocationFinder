#include <SPI.h>
#include <Ethernet.h>

// MAC address from Ethernet shield sticker under board
byte mac[] = { 0x90, 0xA2, 0xDA, 0x0E, 0xD1, 0x90 };
IPAddress ip(10, 30, 2, 20); // IP address, may need to change depending on network
EthernetServer server(80);  // create a server at port 80

String password = "P5SVOrohQpa36cv";
String location = "unknown";
boolean isBusy = false;

String clientRequest = "";
boolean reading = false;

void setup()
{
    Ethernet.begin(mac, ip);  // initialize Ethernet device
    server.begin();           // start to listen for clients
    Serial.begin(9600);
}

void loop()
{
    EthernetClient client = server.available();  // try to get client

    if (client) {  // got client?
        boolean currentLineIsBlank = true;
        while (client.connected()) {
            if (client.available()) {   // client data available to read
                char c = client.read(); // read 1 byte (character) from client
                
                // If we have reached the end of the request, set reading to false
                if (reading && c == ' ') {
                    reading = false;
                }

                // If the '?' is found, start reading the request
                if (c == '?') {
                    reading = true;
                }
                
                // Reading the request
                if (reading) {
                    if (c != ' ') {
                        clientRequest += c;
                    }
                }
                
                // last line of client request is blank and ends with \n
                // respond to client only after last line received                
                if (c == '\n' && currentLineIsBlank) {
                    // send a standard http response header
                    client.println("HTTP/1.1 200 OK");
                    client.println("Content-Type: application/json");
                    client.println("Connection: close");
                    client.println();
                    // send JSON
                    client.print("{\"location\": \"");
                    client.print(location);
                    client.print("\", \"isBusy\": ");
                    client.print(isBusy);
                    client.print("}");
                    break;
                }
                // every line of text received from the client ends with \r\n
                if (c == '\n') {
                    // last character on line of received text
                    // starting new line with next character read
                    currentLineIsBlank = true;
                } 
                else if (c != '\r') {
                    // a text character was received from client
                    currentLineIsBlank = false;
                }
            } // end if (client.available())
        } // end while (client.connected())
        delay(1);      // give the web browser time to receive the data
        client.stop(); // close the connection
        if (clientRequest.length() > 0) {
            readClientRequest(clientRequest);
            clientRequest = "";
        }
        
    } // end if (client)
}

void readClientRequest(String clientRequest)
{
    // Cleaning up the request, removing the '?' and replacing all '%20' with ' '
    String request = clientRequest.substring(1);
    request.replace("%20", " ");
    
    // Getting the indexes of the '&'
    int firstAndIndex = request.indexOf("&");
    int secondAndIndex = request.indexOf("&", firstAndIndex + 1);
    
    // Splitting the request into three at every '&'
    String firstRequest = request.substring(0, firstAndIndex);
    String secondRequest = request.substring(firstAndIndex + 1, secondAndIndex);
    String thirdRequest = request.substring(secondAndIndex + 1);
    
    // Getting the indexes of the '='
    int firstEqualIndex = firstRequest.indexOf("=");
    int secondEqualIndex = secondRequest.indexOf("=");
    int thirdEqualIndex = thirdRequest.indexOf("=");
    
    // Extracting the data after the '='
    String requestPassword = firstRequest.substring(firstEqualIndex + 1);
    String requestLocation = secondRequest.substring(secondEqualIndex + 1);
    String requestIsBusy = thirdRequest.substring(thirdEqualIndex + 1);
    
    Serial.println(requestPassword);
    Serial.println(requestLocation);
    Serial.println(requestIsBusy);
    Serial.println();
    
    if (requestPassword == password) {
        location = requestLocation;
        if (requestIsBusy == "true") {
            isBusy = true;
        }
        else if (requestIsBusy == "false") {
            isBusy = false;
        }
    }
}
