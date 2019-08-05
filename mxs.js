var address = document.getElementById("address");
var output = document.getElementById("output");
var result = document.getElementById("result");
var installerPath = '/usr/share/cc-manager/mxs-installer/';
var installerList = null;

document.getElementById("uninstallButton").addEventListener("click", uninstall);

var mxsPath = '/usr/share/cloudcoffer/';
let installerLS = cockpit.script('mkdir -p '+ installerPath + ' ; mkdir -p '+ mxsPath + ' ; ls '+installerPath);

installerLS.done(function(data) {
  cockpit.file(mxsPath+'mxs-main/mxs-lib/config/version').read()
    .done(function (content, tag) {
       if (content !== null){
        let version = content;

        document.getElementById("mxs-status").textContent = version;
       }
    })
    .fail(function (error) {
        
    });

  let array = data.split("installer");
  for ( let i = 0; i<array.length-1; i++){
    let node = document.createElement("H4"); 
    let textnode =  document.createTextNode(array[i]+"installer"); 
    node.appendChild(textnode);
    let installButton = document.createElement('button');
    let filename = installerPath + array[i]+"installer";
    filename = filename.replace(/\s+/g, '');
    installButton.className = "btn btn-default btn-primary";
    installButton.filename = filename;
    installButton.textContent = 'Install';
    installButton.onclick = (e)=>{
      let caller = e.target;

      //alert(caller.filename);
      console.log(caller.filename);
      let inst = cockpit.script('mkdir -p '+ mxsPath+'; cd '+installerPath + '; tar -zxvf '+caller.filename + '; mv mxs-main '+ mxsPath+'; cd '+ mxsPath +'mxs-main; sh docker_setup.sh; fab network_docker; fab deploy_docker;');
      inst.done(()=>{location.reload();});
      inst.stream((data)=>{
         if (data.includes("[mxs-info]")){
          document.getElementById("mxs-status").textContent = data;

         }
      });
      
    };

    node.appendChild(installButton);

    let deleteButton = document.createElement('button');
    deleteButton.className = "btn btn-default btn-primary";
    deleteButton.filename = filename;
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = (e)=>{
      let caller = e.target;

      //alert(caller.filename);
      console.log(caller.filename);
      let del = cockpit.script('rm -f '+caller.filename);
      del.done(()=>{location.reload();});
      
    };
    node.appendChild(deleteButton);

    document.getElementById("installerTable").appendChild(node);
  }
   
});

//document.querySelector(".container-fluid").style["max-width"] = "500px";
//document.getElementById("ping").addEventListener("click", ping_run);
document.getElementById('upload').addEventListener('click', readBlob);

function ping_run() {
    var proc = cockpit.spawn(["ping", "-c", "4", address.value]);
    proc.done(ping_success);
    proc.stream(ping_output);
    proc.fail(ping_fail);

    result.innerHTML = "";
    output.innerHTML = "";
}

function ping_success() {
    result.style.color = "green";
    result.innerHTML = "success";
}

function ping_fail() {
    result.style.color = "red";
    result.innerHTML = "fail";
}

function ping_output(data) {
    output.append(document.createTextNode(data));
}

function handleFileSelect(evt) {
  var f = evt.target.files[0]; // FileList object
  var reader = new FileReader();
 reader.onload = (function(theFile) {
         return function(e) {
         var binaryData = e.target.result;
                     //Converting Binary Data to base 64
         var base64String = window.btoa(binaryData);
                     //           //                               //showing file converted to base64
         document.getElementById('base64').value = base64String;
         };
   })(f);
                     //                                   // Read in the image file as a data URL.
  reader.readAsBinaryString(f);
  // Closure to capture the file information.
  //
}

function readBlob() {
    var files = document.getElementById('files').files;
    if (!files.length) {
      alert('Please select a file!');
      return;
    }

    var file = files[0];
    var installerName = file.name.substr(0, file.name.length-1);
   
    cockpit.script('mkdir -p /tmp/upload/');
    cockpit.script('mkdir -p '+installerPath);
    cockpit.script('rm -f ' + installerPath + installerName);

    

    var reader = new FileReader();
    reader.onloadend = function(evt) {
      if (evt.target.readyState == FileReader.DONE) { 
       
        cockpit.file("/tmp/upload/temp.txt").replace(evt.target.result)
        .done(function (tag) {
          cockpit.script('base64 --decode /tmp/upload/temp.txt > ' + installerPath + installerName);
          cockpit.script('rm -f /tmp/upload/temp.txt ');
          alert('Upload Complete');
          location.reload();
        })
        .fail(function (error) {
        });
        
  /*
  cockpit.file("/tmp/test").replace(data)
      .done(function (tag) {
      })
      .fail(function (error) {
      });*/
      }
    };
    reader.readAsText(file);
  
}

function uninstall(e) {
  document.getElementById("mxs-status").textContent = 'Uninstalling';
  let uninstallScript = cockpit.script('cd '+mxsPath+'mxs-main;fab undeploy_docker; cd ..; rm -rf mxs-main ; echo \"[mxs-info]Done\"');
  uninstallScript.done(()=>{location.reload(); });
  uninstallScript.stream((data)=>{
    if (data.includes("[mxs-info]")){
     document.getElementById("mxs-status").textContent = data;

    }
 });
}

// Send a 'init' message.  This tells the tests that we are ready to go
cockpit.transport.wait(function() { });
