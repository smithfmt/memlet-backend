export const slugify = str => {
    str = str.replace(/^\s+|\s+$/g, ''); // trim
    str = str.toLowerCase();

    // remove accents, swap ñ for n, etc
    const from = "àáãäâèéëêìíïîòóöôùúüûñç·/_,:;";
    const to   = "aaaaaeeeeiiiioooouuuunc------";

    for (let i=0, l=from.length ; i<l ; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
        .replace(/\s+/g, '-') // collapse whitespace and replace by -
        .replace(/-+/g, '-'); // collapse dashes

    return str;
};

export const compare = (str1, str2, langs, strict) => {
    let position = 0;
    let score = 0;
    let result = [];
    let last = true;
    let offset = false;
    let wrong = 0;
    let test = str1.toLowerCase().trim();
    let answer = str2.toLowerCase().trim();
    if (answer.match(/\(.*?\)/)) {
        if (!test.match(/\(.*?\)/)) {
            answer = answer.split(/\(.*?\)/)[0].trim();
        };
    };

    const defarticles = ["τό","το","ὁ","ἡ"];
    const engParticles = ["a", "the", "A", "The", "I", "i"];
    const GreekAccentsData = "ἐἒἔ ἑἓἕ εέὲ ΕΈῈ ἘἚἜ ἙἛἝ αάὰᾶᾳᾲᾷᾴ ἀἂἄἆᾀᾂᾄᾆ ἁἃἅἇᾁᾃᾅᾇ ΑΆᾺᾼ ἈἊἌἎᾈᾊᾌᾎ ἉἋἍἏᾉᾋᾍᾏ ηήὴῆῃῂῇῄ ἠἢἤἦᾐᾒᾔᾖ ἡἣἥἧᾑᾓᾕᾗ ΗΉῊῌ ἨἪἬἮᾘᾚᾜᾞ ἩἫἭἯᾙᾛᾝᾟ ιίὶῖ ἰἲἴἶ ἱἳἵἷ ΙΊῚ ἸἺἼἾ ἹἻἽἿ οόὸ ὀὂὄ ὁὃὅ ΟΌῸ ὈὊὌ ὉὋὍ υύὺῦ ὐὒὔὖ ὑὓὕὗ ΥΎῪ ὙὛὝὟ ωώὼῶῳῲῷῴ ὠὢὤὦᾠᾢᾤᾦ ὡὣὥὧᾡᾣᾥᾧ ΩΏῺῼ ὨὪὬὮᾨᾪᾬᾮ ὩὫὭὯᾩᾫᾭᾯ";
    const greekAccents = {};
    GreekAccentsData.split(" ").forEach(accent => {
        let splitAccent = accent.split("");
        splitAccent.shift();
        greekAccents[accent[0]] = splitAccent.join();
    });
    const splitAnswer = answer.split(", ");
    const splitTest = test.split(", ");
    let wordType = "unknown";
    switch (langs[langs.selectedLang]) {
        case "greek" :
            if (langs.lang1==="greek") {
                if (splitTest.length===1 && splitAnswer.includes(splitTest[0])) {
                    answer = splitTest[0];
                };
            } else {
                if (splitAnswer.length===3) {
                    if (defarticles.includes(splitAnswer[2])) {
                        wordType = "noun";
                    } else {
                        wordType = "adj";
                    };
                };
                if (splitAnswer.length===2) wordType = "adj";
                if (splitTest.length!==splitAnswer.length) {
                    switch (wordType) {
                        case "noun":
                            if (splitTest.length===1) answer = splitAnswer[0];
                            break;
                        case "adj":
                            if (splitTest.length===1) answer = splitAnswer[0];
                            console.log("answer",answer)
                            break;
                        case "verb":
                            break;
                        default: 
                            if (splitTest.length===1) answer = splitAnswer[0];    
                            break;
                    };
                };
            };            
            break;
        case "english":
            const answers = [...splitAnswer];
            answers.forEach(ans => {
                const splitAns = ans.split(" ");
                if (engParticles.includes(splitAns[0])) {
                    splitAns.shift();
                    answers.push(splitAns.join(" ").trim());
            }})
            const result = splitTest.reduce((acc, cur) => {
                if (!answers.includes(cur)) return false;
                return true;
            },true);
            if (result) {
                answer = test;
            } else if (splitTest.length===1) {
                const spacedTest = splitTest[0].split(" ");
                if (engParticles.includes(spacedTest[0])) {
                    spacedTest.shift();
                    const noParticleTest = spacedTest.join(" ").trim();
                    if (answers.includes(noParticleTest)) {
                        answer = test;
                    };
                };
            };
            break;
        case "latin":
            if (langs.lang1==="latin") {
                if (splitTest.length===1 && splitAnswer.includes(splitTest[0])) {
                    answer = splitTest[0];
                };
            } else {
                if (splitAnswer.length===3) {
                    if (["m.", "f.", "n.", "m", "f", "n"].includes(splitAnswer[3])) {
                        wordType = "noun";
                    } else {
                        const ends = splitAnswer.map(val => {return val.slice(val.length-1)}).join("");
                        if (ends === "rim" || ends === "ris") {
                            wordType = "verb";
                        } else wordType = "adj";
                    };
                };
                if (splitAnswer.length===2) wordType = "adj";
                if (splitAnswer.length===4) {
                    const ends = splitAnswer.map(val => {return val.slice(val.length-1)}).join("");
                    if (ends === "oeim") wordType = "verb";
                };
                if (splitTest.length!==splitAnswer.length) {
                    switch (wordType) {
                        case "noun":
                            if (splitTest.length===1) answer = splitAnswer[0];
                            break;
                        case "adj":
                            if (splitTest.length===1) answer = splitAnswer[0];
                            break;
                        case "verb":
                            if (splitTest.length===1) answer = splitAnswer[0];
                            break;
                        default: 
                            if (splitTest.length===1) answer = splitAnswer[0];
                            break;
                    };
                };
            };
            break;
        default: break;
    };
    
    
    // compare the test and answer values //
    const testArr = test.split("");
    const answerArr = answer.split("");
    testArr.forEach(char => {
        if (wrong>1) {
            result.push({char, correct: "incorrect"});
            position++;
            return;
        };
        if (answerArr[position]===char||(strict===false&&greekAccents[char]&&greekAccents[char].includes(answerArr[position]))) {
            result.push({char, correct: "correct"});
            score++;
            last = true;
            position++;
            return;
        };
        if ((last===false || offset===true) && (answerArr[position-1]===char || (strict===false&&greekAccents[char]&&greekAccents[char].includes(answerArr[position-1])))) {
            result.push({char, correct: "correct"});
            score++;
            last = true;
            offset = true;
            position++;
            return;
        };
        result.push({char, correct: "incorrect"});
        last = false;
        position++;
        wrong++;
    });
    if (testArr.length < answerArr.length&&wrong<2&&result[result.length-1].correct==="correct") {
        const remaining = answerArr.slice(testArr.length);
        remaining.forEach((char) => {
            result.push({char, correct: "incorrect"});
        });
    };
    if (wrong>1) {
        let firstWrong = false;
        result = result.map((res, i) => {
            if (i===result.length-1 && testArr.length === answerArr.length) {
                if (res.char === answerArr[answerArr.length-1]) {
                    return {char: res.char, correct: "correct"};
                };
            };
            if (firstWrong) {
                if (res.correct==="correct") score = score-1;
                res.correct = "incorrect";
            };
            if (res.correct==="incorrect") firstWrong = true;
            return res;
        });
    };
    const percentage = testArr.length>answerArr.length-1 ? Math.floor((score/testArr.length)*100) : Math.floor((score/answerArr.length)*100);
    return [result, percentage];
};