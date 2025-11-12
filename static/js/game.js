document.addEventListener("DOMContentLoaded",() => {
    let timeoutID;
    let startFlag = 0; // 0→開始前、1→ゲーム中、2→終了
    let startTime;
    let missTypeCount = 0;
    let typeCount = 0;
    let current = 0;
    let letterCount= 0;
    let typedText;
    let untypedText;

    const wordObjList = [];
    const wordLength = 20
    const panelContainer = document.getElementsByClassName('panel-container')[0];
    const wordCountText = document.getElementById("wordCount");
    // wordLenghtに合わせて表示を動的に変更する。（cssを手動で変更する必要がある。）
    document.getElementById('wordLength').textContent = `/${wordLength}`
    const missMountText = document.getElementById("missMount");
    // 経過時間用
    const timeText = document.getElementById("timeText");
    const scoreText = document.getElementById("score");
    const otherResult = document.getElementById("other-result");
    const resultSection = document.getElementById("results");
    const infoBox = document.getElementById('info')
    
    //効果音
    const clearSound = document.getElementById("type_clear")
    const missSound = document.getElementById("type_miss")
    const countSound = document.getElementById("count_down")
    const startSound = document.getElementById("start_sound")

    //フィッシャー・イェーツのシャッフル (Fisher-Yates Shuffle)    
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            // 0からiまでのランダムなインデックスを生成
            const j = Math.floor(Math.random() * (i + 1));
            // array[i] と array[j] を入れ替える
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function wordObjListMake(data){
        //2
        const lines = data.split("\n")
        shuffleArray(lines)
        //3
        for(let i=0;i<wordLength;i++){
            let word = lines[i].split(",");
            wordObjList.push({
                "untyped": word[0],
                "typed": "",
                "word": word[0],
                "letterLength":word[0].length,
            });
        };
    }

    function displayTime() {
        //1
        const currentTime = new Date(Date.now() - startTime);
        //2
        const s = String(parseInt(currentTime.getMinutes()) * 60 + parseInt(currentTime.getSeconds())).padStart(2, "0");
        const ms = String(currentTime.getMilliseconds()).padStart(3, "0");
        timeText.textContent = `${s}.${ms}`;
        //3
        timeoutID = setTimeout(displayTime, 10);
    }

    function createPanels() {
        // 1
        panelContainer.innerHTML = "";
        for (let i = 0; i < wordLength ; i++) {
            const panel = document.createElement("div");
            const typedSpan = document.createElement("span");
            const untypedSpan = document.createElement("span");

            typedSpan.id = "typed-"+i
            typedSpan.className = "typed"
            untypedSpan.id = "untyped-"+i
            untypedSpan.className = "untyped"
            panel.className = "panel";
            panel.id = "panel-" + i;

            //2
            untypedSpan.textContent = wordObjList[i]["untyped"];
            //3
            letterCount += wordObjList[i]["letterLength"];

            panel.appendChild(typedSpan);
            panel.appendChild(untypedSpan);
            panelContainer.appendChild(panel);
            //4
            panelContainer.classList.add('panel-container-play')
        }
        document.getElementById("panel-0").classList.add("active")
    }
    function highlightCurrentPanel() {
        //1
        let currentPanel = document.getElementById(`panel-${current-1}`);
        let nextPanel = document.getElementById(`panel-${(current)}`)
        //2
        currentPanel.classList.remove("active");
        currentPanel.classList.add("faded");
        nextPanel.classList.add("active")
    }

    function processStartGame (){
        //1
        for (let i = 3,j=0; i >= 1; i--,j++) {
            setTimeout(() => {
                infoBox.textContent = i;
                countSound.currentTime = 0;
                countSound.play();
            }, j*1000)
        }
        //2
        setTimeout(async ()=> {
            startFlag = 1;
            infoBox.textContent = "";
            await fetch(`csv/word-${level}.csv`).then(response => response.text()).then(data => wordObjListMake(data))
            createPanels();
            startTime = Date.now();
            displayTime();
            typedText = document.getElementById(`typed-${current}`);
            untypedText = document.getElementById(`untyped-${current}`);
        },3000);
    }

    function inputCheck(key){
        // Userの入力数カウント用の変数をインクリメントする。
        typeCount += 1;

        // 正解のキーをタイプしたら
        //1(a)
        if(key == wordObjList[current]["untyped"].charAt(0)){
            // 音声再生ごとに、最初から流れるようにする。
            clearSound.currentTime = 0;
            clearSound.play();

            //1(b)
            wordObjList[current]["typed"] = wordObjList[current]["typed"] + wordObjList[current]["untyped"].charAt(0);
            wordObjList[current]["untyped"] = wordObjList[current]["untyped"].substring(1);

            //1(c)
            typedText.textContent = wordObjList[current]["typed"]
            untypedText.textContent = wordObjList[current]["untyped"]

            // ラスト1文字→次のワードへ
            //2
            if(wordObjList[current]["untyped"].length == 0){

                //一単語分終了したので、current インデックスをインクリメントする。
                current += 1;
                wordCountText.textContent = current;
                // ゲームの最終単語→ゲーム終了
                //3(a)
                if(current == wordLength){
                    processEndGame();
                }
                //3(b)
                else{
                    highlightCurrentPanel();
                    //3(c)
                    typedText = document.getElementById(`typed-${current}`)
                    untypedText = document.getElementById(`untyped-${current}`)
                }
            }
        }
        //4
        else{
            missSound.currentTime = 0;
            missSound.play();
            missTypeCount += 1;
            missMountText.textContent = missTypeCount;
        }
    }

        function processEndGame(){
            //1
            clearTimeout(timeoutID);
            const stopTime = (Date.now() - startTime);
            //2
            const score = parseInt((typeCount / stopTime) * 60000 * (letterCount / typeCount) ** 3);
            scoreText.textContent = `SCORE : ${score}`;
            otherResult.textContent = `合計入力文字数（ミスを含む):${typeCount}`;
            resultSection.style.display = "flex";
            //3
            // 全パネルのハイライトを消す
            for (let i = 0; i < wordLength; i++) {
                const panel = document.getElementById("panel-" + i);
                panel.classList.remove("active","faded");
            };
            //4
            startFlag = 2;
            window.scrollTo({
                top: 100,      // 縦スクロールの位置
                left: 0,     // 横スクロールの位置（通常は 0 のままでOK）
                behavior: "smooth"
            });
        };

    //ジャンル選択用
    const levelBtns = document.querySelectorAll(".level_btn");
    //active-leveクラスがついたlabelタグの子要素のinputタグを取得する。
    let radioInput = document.querySelector(".active-level input");
    let level = radioInput.value;

    //1
    levelBtns.forEach(element => {
        element.querySelector("input").addEventListener("click",(event) => {
            handleLevenChange(event.target)
        });
    });

    function handleLevenChange(newRadioInput){
        //今まで選択していたradioボタンと異なれば
        //2
        if(radioInput !== newRadioInput){
            level = newRadioInput.value;
            newRadioInput.parentElement.classList.add("active-level");
            radioInput.parentElement.classList.remove("active-level");
            radioInput = newRadioInput;
        }

    }
    
    window.addEventListener("keydown", (event) => {
        //2
        if(startFlag == 0 && event.key == " "){
            processStartGame()
        }
        //3
        else if(startFlag == 1 && event.key.length == 1 && event.key.match(/^[a-zA-Z0-9!-/:-@¥[-`{-~\s]*$/)){
            inputCheck(event.key);
        }
        // 追加:2
        else if(startFlag == 2 && (event.key =="Enter" || event.key == "Escape")){
            this.location.reload()
        }
    })
})