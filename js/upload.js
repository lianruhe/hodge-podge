function getError (option, xhr) {
  const msg = `Cannot post ${option.action} ${xhr.status}`
  const err = new Error(msg)
  err.status = xhr.status
  err.method = 'post'
  err.url = option.action
  return err
}

function getBody (xhr) {
  const text = xhr.responseText || xhr.response
  if (!text) {
    return 'no body!'
  }

  try {
    return JSON.parse(text)
  } catch (e) {
    console.error(e)
  }

  return text
}

export default function upload (option) {
  const xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP')
  
  if (xhr.upload) {
    xhr.upload.onprogress = e => {
      if (e.total > 0) {
        e.percent = e.loaded / e.total * 100
      }
      option.onProgress(e)
    }
  }

  const formData = new FormData()
  formData.append(option.name, option.file)
  if (option.data) {
    Object.keys(option.data).map(key => {
      formData.append(key, option.data[key])
    })
  }

  xhr.onerror = e => {
    option.onError(e)
  }

  xhr.onload = () => {
    if (xhr.status !== 200) {
      return option.onError(getError(option, xhr), getBody(xhr))
    }

    option.onSuccess(getBody(xhr))
  }

  xhr.open('post', option.action, true)
  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
  xhr.send(formData)
}
