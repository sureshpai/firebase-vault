# firebase-vault

Have you ever stored personal information in a file on a PC? If so, there is a high
chance that you protected the file by a password/passphrase, so that only you could
read/update that file. I use  [bcrypt](http://bcrypt.sourceforge.net/) on my PC.

With the advent of mobile devices, it would be mighty cool to make such a file accessible
to all of your devices. Such a solution requires:
 - a storage device that can be accessed on the internet.
 - an application that can access the file, do the encryption/decryption on the device, and
 allow you to read/edit the file.

 Here is one such solution. Note that I have no immediate plans of making it a service. So,
 this repository is just a blueprint for you to set it up for your own use.

 There are commercial services like [Fogpad](https://www.fogpad.net/) that provide similar
 functionality. So, why write another one? This was mostly an itch that I needed to scratch.
 I have always wanted to do this project; hopefully putting it down now will help me focus on
 other things. Maybe I will actually use it!.

 ## The stack

 [Firebase](https://firebase.com) will be the storage device. Firebase also provides hosting, so that is
 an additional plus.

 I will use a browser on all devices to access the "application". The "application" will be
 an angular thick client, which will use [SJCL](https://crypto.stanford.edu/sjcl/,"Stanfords Javascript Crypto Library")
 to handle encrypting/decrypting using javascript on the browser.

 Since ordinary text is so boring on a mobile device, I will add markdown support. Markdown documents
 are ordinary text files written with some conventions, that allow it to be converted to HTML.
 [Showdown](https://github.com/showdownjs/showdown,"Showdown JS")
 can be used to convert markdown documents to html.
