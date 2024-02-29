import inquirer from 'inquirer'
import { writeFile } from 'fs/promises'

const compilerOptions = {
    base: {
        // Base options
        esModuleInterop: true,
        skipLibCheck: true,
        target: 'es2022',
        allowJs: true,
        resolveJsonModule: true,
        moduleDetection: 'force',
        isolatedModules: true,
        // Strictness options
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        allowUnreachableCode: false,
    },
    strictness: {
        loose: {
            strict: false,
        },
        strict: {
            strict: true,
        },
        strictest: {
            strict: true,
            noUncheckedIndexedAccess: true,
        },
    },
    transpilation: {
        yes: {
            moduleResolution: 'NodeNext',
            module: 'NodeNext',
            outDir: 'dist',
            sourceMap: true,
        },
        no: {
            moduleResolution: 'Bundler',
            module: 'ESNext',
            noEmit: true,
        },
    },
    monorepo: {
        yes: {
            composite: true,
            declarationMap: true,
        },
        no: {},
    },
}

async function writeConfigFile(configObject) {
    const content = JSON.stringify(configObject, null, 2);
    await writeFile('tsconfig.json', content, 'utf8');
}

async function main() {
    const answers = await inquirer.prompt([
        {
            name: 'Strictness',
            type: 'list',
            message: 'How strict should TS be?',
            choices: ['strictest', 'strict', 'loose'],
        },
        {
            name: 'Transpilation',
            type: 'list',
            message: 'Will TS code be transpiled to JS?',
            choices: ['yes', 'no'],
        },
        {
            name: 'DOM',
            type: 'list',
            message: 'Will the code run in the DOM (Frontend)?',
            choices: ['yes', 'no'],
        }
    ])

    const is_transpiled = answers['Transpilation'] === 'yes'
    const environment = is_transpiled
        ? await inquirer.prompt([
            {
                name: 'Library',
                type: 'list',
                message: 'Are you building for a library?',
                choices: ['yes', 'no'],
            }
        ])
        : null

    const is_library = is_transpiled ? environment['Library'] === 'yes' : false
    const monorepo = (is_transpiled && is_library)
        ? await inquirer.prompt([
            {
                name: 'Monorepo',
                type: 'list',
                message: 'Is the library in a monorepo?',
                choices: ['yes', 'no'],
            }
        ])
        : null

    const config = {
        compilerOptions: {
            ...compilerOptions.base,
            ...compilerOptions.strictness[answers.Strictness],
            ...compilerOptions.transpilation[answers.Transpilation],
            ...compilerOptions.monorepo[monorepo ? monorepo['Monorepo'] : 'no'],
            declaration: environment ? environment['Library'] === 'yes' : false,
            lib: answers['DOM'] === 'yes' ? ["es2022", "dom", "dom.iterable"] : ['es2022'],
        },
    }

    // Generate the tsconfig.json file
    await writeConfigFile(config)
}

main()
