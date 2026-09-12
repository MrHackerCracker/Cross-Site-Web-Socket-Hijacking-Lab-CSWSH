**Installation of Cross Site Web Socket Hijacking Lab (CSWSH)**

Firstly copy the github repo link
<img width="1886" height="707" alt="image" src="https://github.com/user-attachments/assets/794c00d5-abb5-4baa-b676-31d05af07db6" />

Then do git clone in terminal
<img width="1207" height="276" alt="image" src="https://github.com/user-attachments/assets/55bd5f22-fd02-41e5-b73c-b67ebfc22c45" />




Now setup the Domain Names in "/etc/hosts"  
127.0.0.1 attacker.local chatapp.local controlserver.local  
<img width="1217" height="525" alt="image" src="https://github.com/user-attachments/assets/6c48ee13-315d-49e5-acaf-8f80098cef1f" />
  
  
  
  
  
We will now setup the Vulnerable Web-Socket Chat Application  
Step 1: Go inside "/Cross-Site-Web-Socket-Hijacking-Lab-CSWSH/lab_websocket"  
Step 2: Write "sudo apt update", "sudo apt install mkcert", "mkcert -install" to install the local CA for our project.  
Step 3:  
<img width="1667" height="832" alt="image" src="https://github.com/user-attachments/assets/73868fd0-fc5d-4c95-8093-8cec01a9fd4d" />
