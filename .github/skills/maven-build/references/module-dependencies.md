# Module Dependencies Reference

Common dependency chains when building specific modules.

## Core Modules (Build First)
These modules are dependencies for many others:
- `hub_core-ejb`
- `hub_framework`
- `api-errors`
- `hub_logging_util`

## API Modules
```cmd
# customer_api requires api-errors
mvn clean install -gs resources\settings.xml -pl api-errors -pl customer_api -Dhsn.classifier=DESK -Dscws.interface.version=i2 -Dows.interface.version=i2.0 -DskipTests=true -DCVS_BRANCH=Test -P DESK
```

## OrderService Chain
```cmd
# hub_orderService requires multiple dependencies
mvn clean install -gs resources\settings.xml -pl hub_orderServiceModel -pl hub_orderWorkflow -pl hub_orderWorkflowConfig -pl hub_orderService -Dhsn.classifier=DESK -Dscws.interface.version=i2 -Dows.interface.version=i2.0 -DskipTests=true -DCVS_BRANCH=Test -P DESK
```

## Selfcare Chain
```cmd
mvn clean install -gs resources\settings.xml -pl hub_framework -pl hub_selfcare -Dhsn.classifier=DESK -Dscws.interface.version=i2 -Dows.interface.version=i2.0 -DskipTests=true -DCVS_BRANCH=Test -P DESK
```

## EAR Deployments
```cmd
# OrderService EAR
mvn clean install -gs resources\settings.xml -pl hub_orderService-ear -Dhsn.classifier=DESK -Dscws.interface.version=i2 -Dows.interface.version=i2.0 -DskipTests=true -DCVS_BRANCH=Test -P DESK
```

## Test Examples

### hub_orderentry-ejb Tests
```cmd
mvn -gs resources\settings.xml -Dtest=SubscriptionControllerTest test -pl hub_orderentry-ejb -Dhsn.classifier=DESK -Dinterface.version=i1.7 -DCVS_BRANCH=Test -DBUILD_ID=Test -P DESK
```

### Run All Tests in Module
```cmd
mvn -gs resources\settings.xml test -pl <module> -Dhsn.classifier=DESK -Dinterface.version=i1.7 -DCVS_BRANCH=Test -DBUILD_ID=Test -P DESK
```

## Quick Reference: All Modules
Core: `aws`, `agency`, `hub_core-ejb`, `hub-ejb-client`, `hub_framework`
File: `hub_file`, `hub_fonts`, `hub_letterprint`, `hub_report`, `hub_report_engine`
Order: `hub_orderService`, `hub_orderServiceModel`, `hub_orderWorkflow`, `hub_orderWorkflowConfig`, `hub_orderentry-ejb`
API: `api-errors`, `customer_api`, `payment_api`, `api-user-auth`, `authentication_management-api`
Selfcare: `hub_selfcare`, `csp`
Integration: `equifax_rest`, `equifax_ws`, `transunion_rest`
