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

// function ping_run() {
//     var proc = cockpit.spawn(["ping", "-c", "4", address.value]);
//     proc.done(ping_success);
//     proc.stream(ping_output);
//     proc.fail(ping_fail);

//     result.innerHTML = "";
//     output.innerHTML = "";
// }

// function ping_success() {
//     result.style.color = "green";
//     result.innerHTML = "success";
// }

// function ping_fail() {
//     result.style.color = "red";
//     result.innerHTML = "fail";
// }

// function ping_output(data) {
//     output.append(document.createTextNode(data));
// }

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

    let start = 0;
    let length = 10000000;

    var reader = new FileReader();
    reader.onloadend = function(evt) {
      if (evt.target.readyState == FileReader.DONE) { 
        let text = evt.target.result;
        try {
          window.atob(text);
          start = 0;
          writeBlob(start, Math.min(length, text.length - start*length), text, file.name); 
        } catch(e) {
           alert('Wrong format');
        }
                       
      }
    };
    reader.readAsText(file);  
}

function writeBlob(start, length, text, filename){
   let readLength = (start + 1) * length < text.length ? length: text.length - start * length;
   let data = text.substr(start*length, readLength);
   let uploadStatus = Math. min( Math.floor( (start + 1) * 100 / ( text.length / length)), 100);
   uploadStatus = uploadStatus.toString() + "%";
   document.getElementById("uploadStatus").textContent = uploadStatus;
   let proc = cockpit.file("/tmp/upload/"+start.toString()).replace(data);
   proc.done(()=>{
    if ((start + 1) * length >= text.length){
        document.getElementById("uploadStatus").textContent = '100%';
        combineBlob(0, start, filename);
    }else {
      start ++;
      writeBlob (start, length, text, filename);  
    }

  });
}

function combineBlob(start, end, filename){
  let proc = cockpit.script("cat /tmp/upload/" + start.toString() + " >> /tmp/upload/result");
  proc.done(()=>{
    if (start < end){
      combineBlob(start+1, end, filename);

    }else {
      
      let installerFilename = filename.substr(filename, filename.length-1);
      let proc = cockpit.script("base64 --decode /tmp/upload/result > "+installerPath + installerFilename);
      proc.done(()=>{
        let delproc = cockpit.script("rm -f /tmp/upload/*");
        delproc.done(()=>{
          alert('Upload Complete');
          location.reload();
        });
      });
      
    }
  });
  
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
