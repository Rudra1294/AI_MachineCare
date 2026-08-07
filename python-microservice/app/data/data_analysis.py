import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os

# ------------------------------------
# Load Dataset
# ------------------------------------
current_dir = os.path.dirname(os.path.abspath(__file__))

dataset_path = os.path.join(current_dir, "ai4i2020_dataset.csv")

df = pd.read_csv(dataset_path)

print("="*60)
print("DATASET SHAPE")
print("="*60)
print(df.shape)

print("\n")
print("="*60)
print("FIRST 5 ROWS")
print("="*60)
print(df.head())

print("\n")
print("="*60)
print("LAST 5 ROWS")
print("="*60)
print(df.tail())

# ------------------------------------
# Dataset Information
# ------------------------------------
print("\n")
print("="*60)
print("DATASET INFO")
print("="*60)
print(df.info())

# ------------------------------------
# Missing Values
# ------------------------------------
print("\n")
print("="*60)
print("MISSING VALUES")
print("="*60)

missing = df.isnull().sum()
print(missing)

plt.figure(figsize=(10,4))
sns.heatmap(df.isnull(), cbar=False, cmap="viridis")
plt.title("Missing Value Heatmap")
plt.show()

# ------------------------------------
# Duplicate Rows
# ------------------------------------
print("\n")
print("="*60)
print("DUPLICATE ROWS")
print("="*60)

duplicates = df.duplicated().sum()
print("Duplicate Rows :", duplicates)

# ------------------------------------
# Summary Statistics
# ------------------------------------
print("\n")
print("="*60)
print("SUMMARY STATISTICS")
print("="*60)

print(df.describe())

# ------------------------------------
# Categorical Column
# ------------------------------------
print("\n")
print("="*60)
print("TYPE DISTRIBUTION")
print("="*60)

print(df["Type"].value_counts())

sns.countplot(data=df, x="Type")
plt.title("Machine Type Distribution")
plt.show()

# ------------------------------------
# Target Variable
# ------------------------------------
print("\n")
print("="*60)
print("MACHINE FAILURE DISTRIBUTION")
print("="*60)

print(df["Machine failure"].value_counts())

print("\nPercentage")

print(df["Machine failure"].value_counts(normalize=True)*100)

sns.countplot(data=df, x="Machine failure")
plt.title("Machine Failure Distribution")
plt.show()

# ------------------------------------
# Failure Types
# ------------------------------------
failure_cols = ["TWF","HDF","PWF","OSF","RNF"]

print("\n")
print("="*60)
print("FAILURE TYPE COUNTS")
print("="*60)

for col in failure_cols:
    print(col)
    print(df[col].value_counts())
    print()

plt.figure(figsize=(10,5))

failure_counts = df[failure_cols].sum()

failure_counts.plot(kind="bar")

plt.title("Failure Type Distribution")
plt.ylabel("Count")
plt.show()

# ------------------------------------
# Histograms
# ------------------------------------
numeric_cols = [
    "Air temperature [K]",
    "Process temperature [K]",
    "Rotational speed [rpm]",
    "Torque [Nm]",
    "Tool wear [min]"
]

df[numeric_cols].hist(
    figsize=(12,8),
    bins=30
)

plt.suptitle("Feature Distributions")
plt.show()

# ------------------------------------
# Boxplots
# ------------------------------------
plt.figure(figsize=(14,8))

for i,col in enumerate(numeric_cols):

    plt.subplot(2,3,i+1)

    sns.boxplot(y=df[col])

    plt.title(col)

plt.tight_layout()
plt.show()

# ------------------------------------
# Correlation Matrix
# ------------------------------------
print("\n")
print("="*60)
print("CORRELATION MATRIX")
print("="*60)

corr = df.corr(numeric_only=True)

print(corr)

plt.figure(figsize=(12,10))

sns.heatmap(
    corr,
    annot=True,
    cmap="coolwarm",
    fmt=".2f"
)

plt.title("Correlation Heatmap")

plt.show()

# ------------------------------------
# Pairplot
# ------------------------------------
sns.pairplot(
    df[
        numeric_cols +
        ["Machine failure"]
    ],
    hue="Machine failure"
)

plt.show()

# ------------------------------------
# Relationship with Target
# ------------------------------------
for col in numeric_cols:

    plt.figure(figsize=(6,4))

    sns.boxplot(
        data=df,
        x="Machine failure",
        y=col
    )

    plt.title(f"{col} vs Machine Failure")

    plt.show()

# ------------------------------------
# Outlier Detection using IQR
# ------------------------------------
print("\n")
print("="*60)
print("OUTLIERS")
print("="*60)

for col in numeric_cols:

    Q1 = df[col].quantile(0.25)
    Q3 = df[col].quantile(0.75)

    IQR = Q3-Q1

    lower = Q1 - 1.5*IQR
    upper = Q3 + 1.5*IQR

    outliers = df[
        (df[col]<lower) |
        (df[col]>upper)
    ]

    print(f"{col}")

    print("Outliers :",len(outliers))

    print()

# ------------------------------------
# Machine Type vs Failure
# ------------------------------------
plt.figure(figsize=(7,5))

sns.countplot(
    data=df,
    x="Type",
    hue="Machine failure"
)

plt.title("Machine Type vs Failure")

plt.show()

# ------------------------------------
# Correlation with Target
# ------------------------------------
print("\n")
print("="*60)
print("FEATURE CORRELATION WITH TARGET")
print("="*60)

target_corr = corr["Machine failure"].sort_values(
    ascending=False
)

print(target_corr)

# ------------------------------------
# Class Percentage
# ------------------------------------
print("\n")
print("="*60)
print("CLASS BALANCE")
print("="*60)

healthy = len(df[df["Machine failure"]==0])
failure = len(df[df["Machine failure"]==1])

print("Healthy :",healthy)
print("Failure :",failure)

ratio = healthy/failure

print("Healthy : Failure =",round(ratio,2),":1")

print("="*60)
print("EDA COMPLETED")
print("="*60)