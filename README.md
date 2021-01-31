# Create your own smart devices  

This project contains the code which demonstrates the integration of smart home devices with the Google Assistant  
using a Firebase backend.

## How to  

Refer to the video below for step by step guidelines.    

<a href="http://www.youtube.com/watch?feature=player_embedded&v=e1C5WIfZ89s
" target="_blank"><img src="http://img.youtube.com/vi/e1C5WIfZ89s/0.jpg"
alt="Detailed Youtube Video" width="240" height="180" border="10" /></a>   


1. Go to the Actions on Google Developer Console.    
2. Click New Project, enter a name for the project, and click CREATE PROJECT.     
3. Select the Smart Home App.     
4. On the Overview screen in the Actions console, select Smart home.   
5. Choose the Smart home experience card, and you will then be directed to your project console.   
6. Download and install Node.js from https://nodejs.org/en/download/.   
7. To install the firebase CLI, run the following npm command from the terminal:
   ```    
   sudo npm install -g firebase-tools   
   ```   
8. To verify that the CLI has been installed correctly, run:   
   ```   
   firebase --version     
   ```   
9. Authorize the Firebase CLI with your Google account by running:   
   ```    
   firebase login    
   ```   
10. Install git and clone the project using:   
    ```   
    sudo apt-get install git   
    git clone https://github.com/shivasiddharth/google-actions-smarthome   
    ```   
11. Change directory using:   
    ```   
    cd /google-actions-smarthome/smarthome-control/functions/   
    ```   
12. Navigate to the Google Cloud Console API Manager for your project id.    
13. Enable the HomeGraph API.   
14. Navigate to the Google Cloud Console API & Services page.      
15. Select Create Credentials and create a Service account key.   
16. Create a new Service account.   
17. Use the role Service Account > Service Account Token Creator.    
18. Create the account and download a JSON file. Save this in the functions folder as smart-home-key.json   
19. Connect to firebase using:   
    ```   
    firebase use <project-id>   
    ```   
20. Deploy firebase using:   
    ```   
    sudo npm install   
    firebase init database    
    firebase deploy   
    ```   
21. In the Actions console under Overview > Build your Action, select Add Action(s). Enter the URL for your cloud function that provides fulfillment for  the smart home intents and click Save.   
    ```   
    https://us-central1-<project-id>.cloudfunctions.net/smarthome   
    ```   
22. On the Develop > Invocation tab, add a Display Name for your Action, and click Save. This name will appear in the Google Home app.   
23. To enable Account linking, select the Develop > Account linking option in the left navigation. Use these account linking settings:   
    ```   
    Client ID               : ABC123   
    Client secret           : DEF456
    Authorization URL       : https://us-central1-<project-id>.cloudfunctions.net/fakeauth  
    Token URL               : https://us-central1-<project-id>.cloudfunctions.net/faketoken   
    ```
24. Click Save to save your account linking configuration, then click Test to enable testing on your project.   
25. To link to Google Assistant:  
    1. On your phone, open the Google Assistant settings. Note that you should be logged in as the same account as in the console.   
    2. Navigate to Google Assistant > Settings > Home Control (under Assistant).   
    3. Select the plus (+) icon in the bottom right corner.   
    4. You should see your test app with the [test] prefix and the display name you set.   
    5. Select that item. The Google Assistant will then authenticate with your service and send a SYNC request, asking your service to provide a list of devices for the user.   
26. Now pre-programmed devices will appear in the Google Home app.   

## Pre-programmed smart devices   

The codes in this project will create the following devices:  
1. 1 RGB light with brightness, color and on/off control.    
2. 1 Normal light with brightness and on/off control.  
3. 1 Fan with speed and on/off control (speed control trait is currently disabled by google hence the corresponding segments of codes have been commented out).   
4. 1 Thermostat with mode change and temperature control.  
5. 1 Temperature sensor device with temperature readout only.  
6. 1 Plug/Switch.     

## Adding or modifying the devices     

The devices can be added or modified from the **devices.json** within the functions folder.  Use https://jsonlint.com to validate your device list in the JSON file.      

## Note

1. Use the Arduino Json library version 5.13.0
2. Use Firebase Arduino library from here: https://github.com/FirebaseExtended/firebase-arduino.git   
3. Default **USER_ID**  is set to **123** in the index.js file. Please change it to something unique to make use of Homegraph based reporting.    
4. Use esp8266 core version 2.5.2  
5. You need to setup a billing account for utilizing firebase services more details can be found [here](https://firebase.google.com/support/faq#expandable-9).     
6. Though you setup a billing account, you have free usage limits. So, if your usage is within the limits, you will not be billed. More details can be found [here](https://firebase.google.com/support/faq#expandable-10).     


## License
Copyright 2020 Google Inc.

Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements. See the NOTICE file distributed with this work for additional information regarding copyright ownership. The ASF licenses this file to you under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
