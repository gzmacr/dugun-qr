// Cloudinary unsigned upload ayarları.
// API SECRET KESİNLİKLE tarayıcıya koyulmaz.
const CLOUD_NAME = "jsdnxrkh";
const UPLOAD_PRESET = "dugun8826";
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

const form = document.getElementById("uploadForm");
const media = document.getElementById("media");
const note = document.getElementById("note");
const btn = document.getElementById("submitBtn");
const statusBox = document.getElementById("status");
const fileList = document.getElementById("fileList");
const progressWrap = document.getElementById("progressWrap");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

function setStatus(text, type=""){
  statusBox.textContent = text;
  statusBox.className = "status " + type;
}

function showFiles(){
  const files = [...media.files];
  if(!files.length){
    fileList.style.display = "none";
    fileList.innerHTML = "";
    return;
  }
  fileList.style.display = "block";
  const names = files.map((f,i)=>`${i+1}. ${f.name} (${Math.round(f.size/1024/1024*10)/10} MB)`);
  fileList.innerHTML = names.join("<br>");
}

media.addEventListener("change", showFiles);

function uploadOne(file, noteText){
  return new Promise((resolve, reject)=>{
    const xhr = new XMLHttpRequest();
    xhr.open("POST", UPLOAD_URL);

    xhr.upload.addEventListener("progress", e=>{
      if(e.lengthComputable){
        // Dosya içi ilerleme, genel ilerleme yerine yalnızca bilgi amaçlı.
        progressText.textContent = `${file.name} yükleniyor… %${Math.round(e.loaded/e.total*100)}`;
      }
    });

    xhr.onload = ()=>{
      try{
        const data = JSON.parse(xhr.responseText);
        if(xhr.status >= 200 && xhr.status < 300){
          resolve(data);
        }else{
          reject(new Error(data?.error?.message || "Yükleme başarısız."));
        }
      }catch{
        reject(new Error("Cloudinary yanıtı okunamadı."));
      }
    };

    xhr.onerror = ()=>reject(new Error("İnternet bağlantısı veya Cloudinary bağlantısı başarısız."));
    xhr.ontimeout = ()=>reject(new Error("Yükleme zaman aşımına uğradı."));
    xhr.timeout = 120000;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", UPLOAD_PRESET);
    fd.append("folder", "gizem-gorkem-dugun");

    // Misafir notu varsa yüklenen dosyanın context alanına eklenir.
    if(noteText){
      fd.append("context", `note=${noteText.replace(/[|=]/g," ").slice(0,500)}`);
    }

    xhr.send(fd);
  });
}

form.addEventListener("submit", async (e)=>{
  e.preventDefault();

  const files = [...media.files];
  const noteText = note.value.trim();

  if(!files.length){
    setStatus("Lütfen en az bir fotoğraf veya video seçin.","error");
    return;
  }

  // Cloudinary unsigned upload için makul boyut kontrolü.
  const tooLarge = files.find(f => f.size > 100 * 1024 * 1024);
  if(tooLarge){
    setStatus(`"${tooLarge.name}" çok büyük. Lütfen 100 MB'dan küçük bir dosya seçin.`,"error");
    return;
  }

  btn.disabled = true;
  progressWrap.hidden = false;
  progressBar.style.width = "0%";
  setStatus("");

  let done = 0;
  let failed = 0;

  for(const file of files){
    try{
      await uploadOne(file, noteText);
      done++;
      const percent = Math.round(done / files.length * 100);
      progressBar.style.width = percent + "%";
      progressText.textContent = `${done} / ${files.length} dosya gönderildi`;
    }catch(err){
      failed++;
      console.error(err);
    }
  }

  if(failed === 0){
    progressBar.style.width = "100%";
    progressText.textContent = "Tamamlandı 🤍";
    setStatus(`✨ ${done} dosyanız başarıyla gönderildi. Çok teşekkür ederiz!`,"success");
    form.reset();
    showFiles();
  }else if(done > 0){
    setStatus(`✨ ${done} dosya gönderildi. ${failed} dosya yüklenemedi; tekrar deneyebilirsiniz.`,"error");
  }else{
    setStatus("Dosyalar yüklenemedi. Cloudinary upload preset ayarını ve internet bağlantısını kontrol edin.","error");
  }

  btn.disabled = false;
});
