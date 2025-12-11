---
hide:
  - toc
---

# :material-database-cog: Data Engineering & High-Performance Stack

> The "Modern Data Stack" I advocate for: separating storage from compute and prioritizing developer experience (DX).

* **[Apache Hudi](https://hudi.apache.org/){ target="_blank" }**: Another open table format option. I prefer Hudi for its upsert capabilities and integration with streaming data sources.
* **[Apache Iceberg](https://iceberg.apache.org/){ target="_blank" }**: High-performance open table format. Brings SQL reliability and time travel to the Data Lakehouse architecture.
* **[Apache Parquet](https://parquet.apache.org/){ target="_blank" }** & **[Apache Avro](https://avro.apache.org/){ target="_blank" }**: The de facto columnar and row-based storage formats for big data processing. Essential for efficient storage and retrieval.
* **[Dagster](https://github.com/dagster-io/dagster){ target="_blank" }**: My orchestration platform of choice. It treats data assets as software products, offering a superior lifecycle management compared to Airflow.
* **[dbt (Data Build Tool)](https://www.getdbt.com/){ target="_blank" }**: The standard for transformation. Enabling software engineering best practices (testing, versioning, documentation) within SQL pipelines.
* **[Great Expectations](https://greatexpectations.io/){ target="_blank" }**: The data quality framework I use to define, monitor, and validate data expectations across pipelines.
* **[MinIO](https://min.io/){ target="_blank" }**: High-performance, S3-compatible object storage. Ideal for on-premise or hybrid cloud setups.
* **[Polars](https://pola.rs/){ target="_blank" }** & **[DuckDB](https://duckdb.org/){ target="_blank" }**: The new standard for local high-performance computing. I use these to replace Pandas for processing large datasets efficiently on a single node.
* **[Presto/Trino](https://trino.io/){ target="_blank" }**: Distributed SQL query engine. I use Trino for interactive analytics across heterogeneous data sources.
