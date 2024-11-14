# @sprungg/code-mapper

## Description

`@sprungg/code-mapper` is a JavaScript/TypeScript project structure analyzer that helps you visualize and understand the structure of your codebase. It analyzes file structures and Abstract Syntax Trees (ASTs) to provide insights into your project's architecture.

## Features

- Analyze JavaScript/TypeScript project structures
- Visualize file and folder hierarchies
- Detect and display import/export relationships
- Generate project statistics

## Installation

npm install @sprungg/code-mapper

## Usage

### Programmatic API

You can also use it programmatically in your Node.js applications:

```typescript
import { mapProject, logStats } from '@sprungg/code-mapper';

async function analyzeProject() {
  const projectPath = './path/to/your/project';
  const graph = await mapProject(projectPath);
  logStats(graph, projectPath);
}

analyzeProject();
```

## Output Example

When you run `@sprungg/code-mapper`, it generates a structured output of your project. Here's an example of what the output might look like:

The `projectGraph` object returned by `mapProject` is structured as follows:

```json
{
  "nodes": [
    {
      "id": "src/index.ts",
      "type": "FILE",
      "name": "index.ts",
      "path": "src/index.ts",
      "metadata": {
        "extension": ".ts"
      }
    },
    {
      "id": "src/analyzers",
      "type": "FOLDER",
      "name": "analyzers",
      "path": "src/analyzers"
    }
  ],
  "relationships": [
    {
      "id": "rel-1",
      "type": "IMPORTS",
      "sourceId": "src/index.ts",
      "targetId": "src/analyzers/fileAnalyzer.ts"
    }
  ]
}
```

`logStat` formats the output to a more readable format:

```
=== Project Structure Analysis ===

📁 Files and Folders:
📂 src
📄 src/index.ts
📂 src/analyzers
📄 src/analyzers/fileAnalyzer.ts
📄 src/analyzers/astAnalyzer.ts

🔗 Dependencies:
src/index.ts → src/analyzers/fileAnalyzer.ts
src/index.ts → src/analyzers/astAnalyzer.ts

📊 Statistics:
Total Files: 3
Total Folders: 2
Total Import Dependencies: 2
```

## Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For any questions or feedback, please open an issue on [GitHub](https://github.com/sprungg/code-mapper/issues).
