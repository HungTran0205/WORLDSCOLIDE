---
name: tm:maven-build
metadata: version: 1.00
description: Build cis-hu-tm-java Maven project with correct parameters. Use when building full project, specific modules, or running tests. Covers mvn clean install, test execution, dependency management, and profile configurations.
---
# Maven Build Skill

Build commands for cis-hu-tm-java project using Maven.

## Working Directory
**PowerShell:**
```powershell
Set-Location "~\WORKBASE\cis-hu-tm-java\tesco_mobile"
```

**CMD:**
```cmd
cd /d c:\Users\tranh1\Desktop\GIT\TM\WORKBASE\cis-hu-tm-java\tesco_mobile
```

## Required Parameters (Always Include)
| Parameter | Value | Purpose |
|-----------|-------|---------|
| `-gs` | `resources\settings.xml` | Maven settings file |
| `-Dhsn.classifier` | `DESK` (default) | Build classifier |
| `-Dscws.interface.version` | `i2` | Selfcare interface version |
| `-Dows.interface.version` | `i2.0` | OrderService interface version |
| `-P` | `DESK` | Maven profile |
| `-DCVS_BRANCH` | `Test` | Branch identifier |

## Build Commands

### Full Project Build (Skip Tests)

**PowerShell (RECOMMENDED):**
```powershell
Set-Location "~\WORKBASE\cis-hu-tm-java\tesco_mobile"
mvn clean install -T -gs "resources\settings.xml" "-Dhsn.classifier=DESK" "-Dscws.interface.version=i2" "-Dows.interface.version=i2.0" "-DskipTests=true" "-DCVS_BRANCH=Test" -P DESK
```

**CMD:**
```cmd
cd /d c:\Users\tranh1\Desktop\GIT\TM\WORKBASE\cis-hu-tm-java\tesco_mobile
mvn clean install -T -gs resources\settings.xml -Dhsn.classifier=DESK -Dscws.interface.version=i2 -Dows.interface.version=i2.0 -DskipTests=true -DCVS_BRANCH=Test -P DESK
```

### Specific Module Build

**PowerShell:**
```powershell
Set-Location "~\WORKBASE\cis-hu-tm-java\tesco_mobile"
mvn clean install -T -gs "resources\settings.xml" -pl <module1> -pl <module2> "-Dhsn.classifier=DESK" "-Dscws.interface.version=i2" "-Dows.interface.version=i2.0" "-DskipTests=true" "-DCVS_BRANCH=Test" -P DESK
```

**CMD:**
```cmd
cd /d c:\Users\tranh1\Desktop\GIT\TM\WORKBASE\cis-hu-tm-java\tesco_mobile
mvn clean install -T -gs resources\settings.xml -pl <module1> -pl <module2> -Dhsn.classifier=DESK -Dscws.interface.version=i2 -Dows.interface.version=i2.0 -DskipTests=true -DCVS_BRANCH=Test -P DESK
```

### Run Unit Tests

**PowerShell:**
```powershell
Set-Location "~\WORKBASE\cis-hu-tm-java\tesco_mobile"
mvn -gs "resources\settings.xml" "-Dtest=<TestClass>" test -pl <module> "-Dhsn.classifier=DESK" "-Dinterface.version=i1.7" "-DCVS_BRANCH=Test" "-DBUILD_ID=Test" -P DESK
```

**CMD:**
```cmd
cd /d c:\Users\tranh1\Desktop\GIT\TM\WORKBASE\cis-hu-tm-java\tesco_mobile
mvn -T -gs resources\settings.xml -Dtest=<TestClass> test -pl <module> -Dhsn.classifier=DESK -Dinterface.version=i1.7 -DCVS_BRANCH=Test -DBUILD_ID=Test -P DESK
```

## Common Module Dependencies
See [references/module-dependencies.md](references/module-dependencies.md) for dependency chains.

## PowerShell Key Differences
- **Quote all `-D` parameters** with double quotes to prevent parsing issues
- Use `Set-Location` instead of `cd` for reliable directory changes
- Quote paths containing spaces or special characters

## Troubleshooting
- **PowerShell parameter errors**: Ensure all `-D` parameters are quoted
- **Missing dependencies**: Build parent modules first or use full project build
- **Test failures**: Check `-Dinterface.version` matches module requirements
- **Directory not found**: Use absolute paths with `Set-Location` in PowerShell
