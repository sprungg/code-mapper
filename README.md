# sprungg-code-mapper

![npm](https://img.shields.io/npm/v/sprungg-code-mapper)
![License](https://img.shields.io/npm/l/sprungg-code-mapper)
![Build Status](https://img.shields.io/github/actions/workflow/status/yourusername/sprungg-code-mapper/ci.yml)

## Description

`sprungg-code-mapper` is a JavaScript/TypeScript project structure analyzer that helps you visualize and understand the structure of your codebase. It analyzes file structures and Abstract Syntax Trees (ASTs) to provide insights into your project's architecture.

## Features

- Analyze JavaScript/TypeScript project structures
- Visualize file and folder hierarchies
- Detect and display import/export relationships
- Generate project statistics

## Installation

npm install sprungg-code-mapper

## Usage

### CLI

You can use `sprungg-code-mapper` directly from the command line:

```bash
npx sprungg-code-mapper <project-path>
```

### Programmatic API

You can also use it programmatically in your Node.js applications:

```typescript
import { mapProject, logStats } from 'sprungg-code-mapper';

async function analyzeProject() {
  const projectPath = './path/to/your/project';
  const graph = await mapProject(projectPath);
  logStats(graph, projectPath);
}

analyzeProject();
```

## Configuration

The tool can be configured using a `tsconfig.json` file in your project root. It respects the `include` and `exclude` options to determine which files to analyze.

## Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For any questions or feedback, please open an issue on [GitHub](https://github.com/yourusername/sprungg-code-mapper/issues).
