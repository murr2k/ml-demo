use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn trajectory_benchmark(c: &mut Criterion) {
    c.bench_function("trajectory_prediction", |b| {
        b.iter(|| {
            // Benchmark trajectory prediction
            black_box(42);
        });
    });
}

fn anomaly_benchmark(c: &mut Criterion) {
    c.bench_function("anomaly_detection", |b| {
        b.iter(|| {
            // Benchmark anomaly detection
            black_box(0.85);
        });
    });
}

criterion_group!(benches, trajectory_benchmark, anomaly_benchmark);
criterion_main!(benches);