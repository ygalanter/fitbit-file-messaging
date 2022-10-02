const testFiles = [
    'dafafeqw',
    'dsffsadsf',
    'myfile',
    'fasdfasf',
    'myfile',
    'fadsasdfgvads',
    'dsfasdfasf'
]

const inbox = {
    pop: function () {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(testFiles.pop())
            }, 1000);
        })
    },

    addEventListener: function (evt, method) { this[evt] = method }
}



const otherFiles = [];
const myFiles = [];

if (inbox.pop) { // this is a companion
    const prevPop = inbox.pop;

    const init = () => {
        inbox.addEventListener("newfile", processCompanionFiles);
        processCompanionFiles();
    }

    const processCompanionFiles = async (evt) => {

        let file = await getNextMyFile();
        if (file === undefined) return;

        console.log(file)
    }

    inbox.pop = async () => {
        if (otherFiles.length > 0) {
            return otherFiles.pop();
        }
        let file;
        while (file = await prevPop()) {
            if (file === 'myfile') {
                myFiles.push(file)
            }
            else {
                return file;
            }
        }
        return undefined;
    }

    const getNextMyFile = async () => {
        if (myFiles.length > 0) {
            return myFiles.pop()
        }
        let file;
        while (file = await prevPop()) {
            if (file === 'myfile') {
                return file;
            }
            otherFiles.push(file);
        }
        return undefined;
    }

    init();

    setInterval(() => {
        inbox.newfile();
    }, 1000);


} 