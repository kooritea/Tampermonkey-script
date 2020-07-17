window.originOpen = XMLHttpRequest.prototype.open

XMLHttpRequest.prototype.open = function(method,url){
  this.method = method
  this.url = url
  if(/studyservice.zhihuishu.com\/popupAnswer\/lessonPopupExam/.test(url)){
    this.addEventListener('readystatechange',function(){
      if(this.readyState === 4){
        autoAnswer(JSON.parse(this.responseText))
      }
    })
  }
  return originOpen.call(this,...arguments)
}

function autoAnswer(data){
  if(data.data.lessonTestQuestionUseInterfaceDtos.length > 1){
    return 
  }
  data.data.lessonTestQuestionUseInterfaceDtos.forEach((question,index)=>{
    let answer = question.testQuestion.questionOptions.find((option)=>{
      return option.result === '1'
    })
    console.log(answer)
    setTimeout(()=>{
      document.querySelectorAll('.topic-list .topic-item')[answer.sort - 1].click()
      setTimeout(()=>{
        document.querySelector('.dialog-test .dialog-footer .btn').click()
        setTimeout(()=>{
          document.querySelector('#playButton').click()
        },parseInt(2000*Math.random()))
      },parseInt(5000*Math.random()))
    },parseInt(10000*Math.random()))
  })
}

setInterval(() => {
  document.getElementById('vjs_container_html5_api').onended = ()=>{
    setTimeout(()=>{
      document.getElementById('nextBtn').click()
    },parseInt(2000*Math.random()))
  }
}, 5000);
