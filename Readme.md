# Online Clustering Algorithm with Size Constraints

# A. Algorithm Definition

In this section the proposed algorithm for performing online clustering with exact size constraints on the clusters is presented. The method processes instances sequentially in a single pass over the data: each point is evaluated and assigned immediately upon arrival, without using buffers or re-processing previously observed instances.

## A.1 Problem formulation

Let a data stream be

$$
D = \{x_1, x_2, \dots, x_N\}
$$

where each instance

$$
x_t \in \mathbb{R}^p
$$

arrives sequentially to the algorithm.

The objective is to construct $k$ clusters

$$
C_1, C_2, \dots, C_k
$$

whose sizes are defined by the user through the vector

$$
E = [E_1, E_2, \dots, E_k]
$$

such that

$$
\sum_{i=1}^{k} E_i = N
$$

Each cluster $C_i$ has a centroid

$$
c_i \in \mathbb{R}^p
$$

and must satisfy

$$
|C_i| = E_i
$$

Each point is assigned exactly once through

$$
R(x_t) \in \{1,\dots,k\}
$$

---

## A.2 Distance used

The distance between a point and a centroid is measured using Euclidean distance

$$
d(x,c) = \|x-c\|_2
$$

For each new point $x_t$ its distance to the nearest centroid is computed

$$
d_t = \min_j \|x_t - c_j\|
$$

This quantity indicates how far the current point is from the existing clusters.

---

## A.3 Cluster founding

While the number of founded clusters is smaller than $k$, the algorithm decides whether the point should create a new cluster or be assigned to an existing one.

---

### A.3.1 Initialization

The first two points of the stream create the first clusters

$$
x_1 \rightarrow C_1
$$

$$
x_2 \rightarrow C_2
$$

This establishes an initial geometric reference of the data space.

---

### A.3.2 Adaptive strategy

For each new point $x_t$ the following value is computed

$$
d_t = \min_j \|x_t - c_j\|
$$

The largest distance observed so far is maintained

$$
D_{\max} = \max_{r < t} \, d_r
$$

This value represents the geometric scale of the space observed in the stream.

---

### A.3.3 Extreme value control

An extremely large distance could artificially inflate the scale of the algorithm.  
To prevent this, a bound based on statistics of the observed distances is introduced.

Let $\mu_{t-1}$ and $\sigma_{t-1}$ be the mean and standard deviation of the distances observed up to the previous instant.

The bound is defined as

$$
cap_{t-1} = \mu_{t-1} + 3\sigma_{t-1}
$$

and the truncated distance

$$
d_t^{cap} = \min(d_t, cap_{t-1})
$$

The scale is updated as

$$
D_{\max} = \max(D_{\max}, d_t^{cap})
$$

---

### A.3.4 Cluster creation rule

The decision to create a new cluster is based on comparing the distance of the current point with an adaptive threshold.

The threshold is defined as

$$
\theta_t =
\left(
1 - \sqrt{\frac{t}{N}}
\right)
D_{\max}
$$

A new cluster is created if

$$
d_t > \theta_t
$$

Otherwise the point is assigned to the nearest cluster.

The factor

$$
1 - \sqrt{\frac{t}{N}}
$$

progressively reduces the threshold as the stream advances.

---

## A.4 Assignment with size constraints

Once $k$ clusters already exist, the algorithm moves to the assignment phase.

A cluster is eligible if

$$
|C_i| < E_i
$$

The assignment combines three ideas: geometric proximity, local ambiguity between the closest centroids, and a penalty based on the cluster filling level.

---

### A.4.1 Ambiguity between centroids

For the current point $x_t$, the distances to all eligible centroids are computed and sorted.  
Let

$$
d_{(1)} \le d_{(2)}
$$

be the two smallest distances.

The ambiguity factor is defined as

$$
a_t = \frac{d_{(1)}}{d_{(2)}}
$$

This value lies in the interval $(0,1]$.

When the two distances are very similar, the value approaches 1.  
This indicates that the point lies in an ambiguous region between two clusters.

---

### A.4.2 Local distance scale

To maintain comparable magnitudes between distances and penalties, a local scale based on the distances of the current point is introduced.

The scale is defined as

$$
s_t = \max\left(\text{median}\{d(x_t,c_i)\}, \varepsilon\right)
$$

where $\varepsilon > 0$ is a small value that avoids divisions by zero.

This scale represents the typical order of magnitude of the distances between the point and the existing centroids.

---

### A.4.3 Occupancy level

For each cluster its occupancy fraction is computed

$$
\rho_i = \frac{|C_i|}{E_i}
$$

This value indicates what proportion of the cluster capacity has been used.

---

### A.4.4 Saturation penalty

To prevent clusters from filling too quickly, a logarithmic penalty is introduced

$$
\pi_i = -\log(1 - \rho_i)
$$

When the cluster is lightly occupied the penalty is small.  
When the cluster approaches its maximum capacity the value grows rapidly.

---

### A.4.5 Assignment rule

For each eligible cluster the total value is computed

$$
T_i = d(x_t, c_i) + a_t \cdot s_t \cdot \pi_i
$$

The point is assigned to the cluster that minimizes

$$
R(x_t) = \arg\min_{i:|C_i| \lt E_i} T_i
$$

This rule combines geometric proximity to the centroid with a penalty that increases when a cluster is close to being full, especially when the assignment is ambiguous.

---

## A.5 Centroid update

After assigning the point $x_t$ to a cluster $C_i$, the centroid is updated.

Let

$$
n_i = |C_i|
$$

be the number of points in the cluster after the assignment.

A decreasing learning rate is used

$$
\alpha_i = \frac{1}{1 + \sqrt{n_i}}
$$

The centroid is updated as

$$
c_i \leftarrow c_i + \alpha_i (x_t - c_i)
$$

---

## A.6 Algorithm Pseudocode

**Input:** data stream $D = \{x_1, \dots, x_N\}$, number of clusters $k$ and target cardinalities $E = [E_1, \dots, E_k]$  
**Output:** labels $R(x_1), \dots, R(x_N)$ and centroids $c_1, \dots, c_k$

```
Algorithm 1: Online clustering with size constraints

Initialize clusters C1,...,Ck ← ∅
Initialize centroids c1,...,ck
Initialize D_max ← 0

for each point x_t in D do

    if the number of founded clusters < k then

        if fewer than 2 clusters exist then
            create new cluster with x_t
        
        else
            compute d_t ← min_j d(x_t, c_j)
            compute θ_t using D_max

            if d_t > θ_t then
                create new cluster with x_t
            else
                AssignAndUpdate(x_t)
            
            truncate d_t
            update D_max for the next iteration

    else
        AssignAndUpdate(x_t)

end


───────────────────────────────────
Procedure AssignAndUpdate(x_t)

    compute d(x_t, c_i) for all i such that |C_i| < E_i

    obtain d_(1) (minimum) and d_(2) (second minimum)
    compute a_t ← d_(1) / d_(2)
    obtain s_t ← median of { d(x_t, c_i) } over eligible clusters

    for each eligible cluster i do
        compute ρ_i ← |C_i| / E_i
        compute π_i ← -log(1 - ρ_i)
        compute T_i ← d(x_t, c_i) + a_t · s_t · π_i

    assign x_t to the cluster with the smallest T_i

    update centroid of the assigned cluster
        c_i ← c_i + α_i (x_t − c_i)
```