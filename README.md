**Installation of Cross Site Web Socket Hijacking Lab (CSWSH)**

\
**Now setup the Domain Names in "/etc/hosts"**  
127.0.0.1 attacker.local chatapp.local controlserver.local  
<img width="1217" height="525" alt="image" src="https://github.com/user-attachments/assets/6c48ee13-315d-49e5-acaf-8f80098cef1f" />

\
\
**We will now setup the Vulnerable Web-Socket Chat Application**  

Step 1: Go inside "***/Cross-Site-Web-Socket-Hijacking-Lab-CSWSH/lab_websocket***"  
Step 2: Write "***sudo apt update***", "***sudo apt install mkcert***", "***mkcert -install***" to install the local CA for our project.  
Step 3: Do "***mkcert chatapp.local localhost 127.0.0.1***", to create keys for the website "***chatapp.local***".
Step 4: Create a folder named "***cert***"  
Step 5: Do "***cp chatapp.local+2.pem cert/cert.pem***", "***cp chatapp.local+2-key.pem cert/key.pem***" for creating the keys.  
Step 6: Install node and npm, if not installed.  
Step 7: Do "***npm init -y***", "***npm install express ws bcryptjs jsonwebtoken***".  
Step 8: Lastly write "***npm start***"  
  
Now visit "***https://chatapp.local:3000***", we can see the lab is running.  

<img width="1667" height="832" alt="image" src="https://github.com/user-attachments/assets/73868fd0-fc5d-4c95-8093-8cec01a9fd4d" />
<img width="1657" height="587" alt="image" src="https://github.com/user-attachments/assets/6246683b-47e1-42b1-a92e-9157a4ccdc8d" />
<img width="1247" height="122" alt="image" src="https://github.com/user-attachments/assets/1d068c6c-8cde-4962-99d6-18f7b7aaccdd" />
<img width="1270" height="125" alt="image" src="https://github.com/user-attachments/assets/18a14e1b-970a-4cc0-b1f3-1a91410b5d07" />
<img width="1537" height="401" alt="image" src="https://github.com/user-attachments/assets/af54405e-d5de-4e24-b32f-7f473111bc06" />
<img width="1622" height="192" alt="image" src="https://github.com/user-attachments/assets/c0e9fc4e-8288-469e-8579-44f750516bef" />
<img width="1576" height="836" alt="image" src="https://github.com/user-attachments/assets/80bcf4af-8382-42bd-a4af-5a99f3878a25" />

\
\
**We will now setup the Attacker Website**  

Step 1: Go to the "***Cross-Site-Web-Socket-Hijacking-Lab-CSWSH/lab/attacker***"
Step 2: Simply write "***python3 -m http.server 8000***"  

The attacker website will be running at "***http://attacker.local:8000***"







