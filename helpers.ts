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

export const compare = (str1, str2) => {
    let position = 0;
    let score = 0;
    let result = [];
    let last = true;
    let offset = false;
    let wrong = 0;
    let test = str1.toLowerCase();
    let answer = str2.toLowerCase();
    if (answer.match(/\(.*?\)/)) {
        if (!test.match(/\(.*?\)/)) {
            answer = answer.split(/\(.*?\)/)[0].trim();
        };
    };
    const testArr = test.split("");
    const answerArr = answer.split("");
    testArr.forEach(char => {
        if (wrong>1) {
            result.push({char, correct: "incorrect"});
            position++;
            return;
        };
        if (answerArr[position]===char) {
            result.push({char, correct: "correct"});
            score++;
            last = true;
            position++;
            return;
        };
        if ((last===false || offset===true) && answerArr[position-1]===char) {
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