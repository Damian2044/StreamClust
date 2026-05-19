# CORT: Online Clustering with Exact Cardinality Constraints

## A. Introduction

**CORT** is presented, an online clustering algorithm with exact cardinality constraints. The method processes observations sequentially, in a single pass over the data stream, and makes an immediate decision for each incoming point. At each instant, the algorithm resolves a competition between two possible actions:

1. assign the observation to an already founded cluster;
2. found a new cluster.

From an optimization perspective, the proposal can be interpreted as a regularized online formulation. The decision does not depend solely on geometric proximity, but also on structural terms that represent residual capacity, relative balance among clusters, and the opening cost of new structure. Consequently, the dynamics of the algorithm can be understood as the comparison between two local minimization problems:

$$
\min_{i \in \mathcal{A}_t} A_i(t)
\qquad \text{and} \qquad
\min_{j \in \mathcal{V}_t} F_j(t),
$$

where:

- $A_i(t)$ is the cost of assigning $x_t$ to the active cluster $i$;
- $F_j(t)$ is the cost of founding the empty cluster $j$.

The final rule is immediate:

- if the lowest cost corresponds to assignment, the point is absorbed into an active cluster;
- if the lowest cost corresponds to foundation, the point opens a new cluster.

This reading places CORT close to sequential formulations of the **facility location** problem, where the total cost combines assignment and opening. The fundamental difference is that, in the present case, these costs are not static: they depend on the current state of the system, the remaining capacity, and the local geometry of the stream.

---

## A.1 Problem formulation

Let the data stream be

$$
D = \{x_1, x_2, \dots, x_N\},
$$

with

$$
x_t \in \mathbb{R}^p,
\qquad t = 1,\dots,N.
$$

The goal is to construct $k$ clusters

$$
C_1, C_2, \dots, C_k
$$

whose target cardinalities are given by

$$
E = [E_1, E_2, \dots, E_k],
\qquad E_i \in \mathbb{N}_{>0},
\qquad \sum_{i=1}^k E_i = N.
$$

Each observation must be assigned exactly once, and the final partition must satisfy

$$
|C_i| = E_i,
\qquad i = 1,\dots,k.
$$

Therefore, the cardinality constraint is not imposed as a later correction, but rather forms part of the decision rule itself.

---

## A.2 State of the system at instant $t$

Before processing $x_t$, the state of each cluster $i$ is given by:

$$
n_i^{(t)} = |C_i|,
\qquad
r_i^{(t)} = E_i - n_i^{(t)},
\qquad
\mu_i^{(t)} \in \mathbb{R}^p.
$$

Here:

- $n_i^{(t)}$ is the number of points already assigned to cluster $i$;
- $r_i^{(t)}$ is its residual capacity;
- $\mu_i^{(t)}$ is its current centroid.

These quantities naturally satisfy:

$$
0 \le n_i^{(t)} \le E_i,
\qquad
0 \le r_i^{(t)} \le E_i.
$$

The following sets are also defined:

$$
\mathcal{A}_t = \{i : \text{founded cluster and } r_i^{(t)} > 0\},
$$

$$
\mathcal{V}_t = \{j : \text{unfounded cluster and } r_j^{(t)} > 0\}.
$$

The set $\mathcal{A}_t$ contains the active clusters still eligible for assignment, while $\mathcal{V}_t$ contains the empty clusters still available for foundation.

The quantity

$$
N - t + 1,
$$

also appears recurrently, representing the number of observations remaining to be processed **including** the current point. 

This variable makes it possible to compare the capacity state of the system with the remaining horizon of the stream.

---

## A.3 Geometric distance and adaptive scale

The dissimilarity between an observation and a centroid is measured by Euclidean distance:

$$
d_i(x_t) = \|x_t - \mu_i^{(t)}\|_2.
$$



Among the active clusters, the geometrically closest cluster is defined as:

$$
g_t = \arg\min_{i \in \mathcal{A}_t} d_i(x_t),
$$

and its associated distance:

$$
\delta_t = d_{g_t}(x_t).
$$

The variable $\delta_t$ summarizes the best geometric fit available for the current observation.

To balance the geometric part and the structural part, CORT uses an adaptive scale:

$$
\lambda_t = \frac{\bar{\delta}_{t-1}}{\log\left(1 + \frac{N}{k}\right)},
$$

where $\bar{\delta}_{t-1}$ is the online mean of the minimum distances observed up to the previous instant. If sufficient history does not yet exist, the substitution

$$
\lambda_t = \frac{\delta_t}{\log\left(1 + \frac{N}{k}\right)}.
$$

is used.

The term

$$
\log\left(1 + \frac{N}{k}\right)
$$

is a positive normalization constant. Its function is to moderate the structural scale as a function of the expected average size per cluster, given by $N/k$, preventing $\lambda_t$ from growing without control as the problem size increases. 

Consequently:

$$
\lambda_t > 0,
$$

and its role is twofold:

1. to keep the structural terms at a magnitude comparable with distance;
2. to adapt the intensity of regularization to the observed geometry of the stream.

---

## A.4 Assignment rule

When at least one active cluster exists, CORT evaluates each candidate $i \in \mathcal{A}_t$ by means of

$$
A_i(t) = d_i(x_t) + \lambda_t\left(\phi_{cap}(i,t) + \phi_{load}(i,t)\right).
$$

This expression can be interpreted, synthetically, as

$$
\text{distance} + \text{structural adjustment}.
$$

More specifically, the assignment decision combines:

1. an immediate geometric cost;
2. a prospective capacity penalty;
3. a relative balance correction.

### A.4.1 Immediate geometric cost

The term

$$
d_i(x_t)
$$

measures how well the observation $x_t$ fits into cluster $i$ at the current instant.

### A.4.2 Capacity penalty

The residual capacity of the cluster is compared with the pending stream:

$$
\phi_{cap}(i,t) = -\log\left(\frac{r_i^{(t)}}{N - t + 1}\right).
$$

This quantity is dimensionless and is well defined whenever $r_i^{(t)} > 0$. Furthermore,

$$
0 < \frac{r_i^{(t)}}{N - t + 1} \le 1,
$$

so the transformation

$$
-\log(\cdot)
$$

maps that interval into

$$
[0, +\infty).
$$

Its interpretation is immediate:

- if $r_i^{(t)}$ is large relative to what remains to be processed, the penalty is small;
- if $r_i^{(t)}$ decreases, the penalty increases;
- if the cluster approaches saturation, the cost grows rapidly.

Therefore, $\phi_{cap}(i,t)$ acts as a logarithmic saturation barrier, discouraging premature assignment to clusters that could run out of capacity before the points corresponding to them arrive.

### A.4.3 Relative balance correction

Residual capacity, by itself, does not describe how mass is being distributed among the active clusters. To correct this aspect, CORT compares, for each cluster $i$, the fraction of mass it **should** have with the fraction of mass it **would have** if it absorbed the current point.

The ideal quota of cluster $i$ within the active set is defined as:

$$
q_i^*(t) = \frac{E_i}{\sum_{h \in \mathcal{A}_t} E_h}.
$$

Here, the numerator $E_i$ is the target cardinality of cluster $i$, while the denominator is the total expected cardinality of the currently active clusters. Therefore, $q_i^*(t)$ represents the ideal fraction of mass that corresponds to cluster $i$ within the active distribution.

This quantity satisfies:

$$
0 < q_i^{\ast}(t) \le 1,
\qquad
\sum_{i \in \mathcal{A}_t} q_i^{\ast}(t) = 1.
$$

Then, the quota that this same cluster would have if the current observation were assigned to it is defined as:

$$
q_i^{(+)}(t) = \frac{n_i^{(t)} + 1}{\sum_{h \in \mathcal{A}_t} n_h^{(t)} + 1}.
$$

In this expression, the numerator $n_i^{(t)} + 1$ corresponds to the size the cluster would reach after receiving $x_t$, while the denominator represents the total active mass after that assignment. Consequently, $q_i^{(+)}(t)$ denotes the relative fraction that cluster $i$ would occupy if the decision were executed on it.

Likewise, it holds that:

$$
0 < q_i^{(+)}(t) \le 1.
$$

The comparison between both quotas indicates whether the cluster has excess mass, lacks mass, or is close to equilibrium. To formalize this comparison, the ratio

$$
\frac{q_i^{(+)}(t)}{q_i^*(t)}.
$$

is introduced.

Its interpretation is direct:

- if it is greater than $1$, the cluster would be above its ideal quota;
- if it is equal to $1$, the cluster would be exactly in equilibrium;
- if it is less than $1$, the cluster would still be below its ideal quota.

With this ratio, the following is defined

$$ 
\phi_{load}(i,t) = \log\left(\frac{q_i^{(+)}(t)}{q_i^*(t)}\right).
$$

The logarithm transforms this relative comparison into an additive deviation centered at zero. Therefore:

- if $q_i^{(+)}(t) > q_i^*(t)$, then $\phi_{load}(i,t) > 0$ and the assignment is penalized;
- if $q_i^{(+)}(t) = q_i^*(t)$, then $\phi_{load}(i,t) = 0$;
- if $q_i^{(+)}(t) < q_i^*(t)$, then $\phi_{load}(i,t) < 0$ and the cluster receives a favorable correction.

Thus, this term penalizes overload and, at the same time, favors clusters that are still below the mass that corresponds to them.

### A.4.4 Final assignment rule

The assignment selected at step $t$ is

$$
i_t^* = \arg\min_{i \in \mathcal{A}_t} A_i(t).
$$

Consequently, the algorithm does not simply choose the closest centroid, but rather the cluster whose trade-off among geometry, capacity, and balance is most favorable.

---

## A.5 Foundation rule

As long as empty clusters are available, the algorithm compares the best assignment with the possibility of founding. For each empty cluster $j \in \mathcal{V}_t$, define:

$$
F_j(t) = -u_j(t) + \lambda_t\left(\phi_{open}(t) + \phi_{cap}(j,t)\right).
$$

This expression can be read as

$$
\text{geometric discount} + \text{structural cost}.
$$

The term $-u_j(t)$ reduces the foundation cost when the current structure does not adequately explain the incoming point. For its part, the structural term $\lambda_t(\phi_{open}(t) + \phi_{cap}(j,t))$ incorporates the cost of introducing new structure and the future viability of the cluster in terms of capacity.

At the instant of foundation, the new cluster is initialized directly at the observation $x_t$, that is, $\mu_j^{(t)} = x_t$. Therefore, each cluster is born as an initial medoid associated with a real point from the stream. In particular, when no cluster has yet been founded, the first cluster is opened with the first observation, but it is assigned to the empty cluster with the largest target capacity. The motivation is structural: starting with the largest cardinality reduces early capacity pressure and reserves, from the beginning, the container with the largest expected future mass.

Subsequently, the representatives cease to be pointwise and evolve centroidally through McQueen's incremental update, allowing continuous adaptation as new observations arrive.


### A.5.1 Geometric utility of foundation

The utility of founding the empty cluster $j$ is defined as

$$
u_j(t) = d_{g_t}(x_t) \cdot \frac{n_{g_t}^{(t)} - 1}{n_{g_t}^{(t)} + 1} \cdot \frac{E_j}{N - t + 1}.
$$

Here,

$$
g_t = \arg\min_{i \in \mathcal{A}_t} d_i(x_t), \qquad \delta_t = d_{g_t}(x_t),
$$

so the utility can be read as

$$u_j(t) = \delta_t \cdot \text{stability of the closest cluster} \cdot \text{relative future mass}.$$

Each factor fulfills a specific function.

The first factor,

$$
\delta_t = d_{g_t}(x_t),
$$

measures the geometric damage of forcing the assignment to the closest active cluster. If $\delta_t$ is large, the point lies in a region poorly explained by the current structure, which favors founding a new cluster.

From the conceptual point of view, this term is analogous to the dispersion criterion used in **k-means++**, favoring the creation of new clusters in regions far from existing ones in order to improve coverage of the space.

Unlike k-means++, where this criterion is used in an offline probabilistic initialization, here it is incorporated as a deterministic utility in an online environment, competing directly with a structural cost to decide between founding and assigning.


The second factor,

$$
\frac{n_{g_t}^{(t)} - 1}{n_{g_t}^{(t)} + 1},
$$

introduces a stability factor for the closest cluster. Its range is

$$
0 \le \frac{n_{g_t}^{(t)} - 1}{n_{g_t}^{(t)} + 1} < 1.
$$

In particular:

- it is $0$ when $n_{g_t}^{(t)} = 1$;
- it grows smoothly as the cluster size increases;
- it tends to $1$ when that cluster is large.

This term modulates the geometric influence as a function of the support of the closest cluster. When the cluster contains few points, its representative is still unstable and the geometric signal is attenuated. As the cluster accumulates observations, its representation becomes more reliable and the geometric utility increases.

The third factor,

$$
\frac{E_j}{N - t + 1},
$$

represents the relative future capacity of the empty cluster with respect to the remaining stream. Its range is

$$
0 < \frac{E_j}{N - t + 1} \le 1.
$$

It is greater when the candidate cluster has enough capacity to absorb a relevant fraction of the observations that are still missing.

Together, $u_j(t)$ has units of distance, so

$$
-u_j(t)
$$

acts as a geometric discount on the foundation cost.


### A.5.2 Structural opening cost

If, at instant $t$, there are $k - K_t$ clusters left to found, define

$$
\phi_{open}(t) = -\log\left(\frac{k - K_t}{N - t + 1}\right).
$$

Here:

- $k - K_t$ is the number of clusters not yet founded;
- $N - t + 1$ is the remaining stream, including the current point.


This term measures the structural cost of introducing a new unit of complexity. The use of the logarithm converts the proportion between remaining clusters and remaining stream into an additive penalty. Thus, when that proportion is large, the structural cost is low; when it becomes small, the cost grows. Intuitively, founding is relatively cheaper when several clusters still remain to be opened in relation to the number of pending points, and it becomes more costly when the remaining structure is scarce relative to the remaining stream. 

### A.5.3 Capacity penalty of the empty cluster

For a cluster not yet founded, its residual capacity coincides with its total cardinality. Therefore:

$$
\phi_{cap}(j,t) = -\log\left(\frac{E_j}{N - t + 1}\right).
$$

This expression has the same structural interpretation as in assignment: a new cluster with large future capacity relative to the pending stream is more viable and, therefore, less costly to open.

### A.5.4 Final foundation rule

The empty cluster chosen for foundation is

$$
j_t^* = \arg\min_{j \in \mathcal{V}_t} F_j(t).
$$

---

## A.6 Global decision: assign versus found

At each instant, CORT compares the two best available costs:

$$
\min_{i \in \mathcal{A}_t} A_i(t)
\qquad \text{and} \qquad
\min_{j \in \mathcal{V}_t} F_j(t).
$$

The global rule is:

- if the lowest cost corresponds to foundation, the point founds a new cluster;
- otherwise, the point is assigned to the best active cluster.

This comparison can be summarized conceptually as

$$
\text{distance} + \text{assignment structure}
\qquad \text{vs} \qquad
\text{opening structure} - \text{geometric utility}.
$$

---

## A.7 Representative update

When the observation $x_t$ is assigned to cluster $i_t^*$, the representative is updated by means of an exact incremental **McQueen** rule. First, a decreasing learning rate is defined:

$$\alpha_{i_t^{\ast}}^{(t)} = \frac{1}{1 + n_{i_t^{\ast}}^{(t)}}.$$

This quantity satisfies

$$
0 < \alpha_{i_t^*}^{(t)} \le 1,
$$

and decreases as the cluster accumulates observations, which makes mature centroids change in an increasingly stable way.

The update is expressed as

$$\mu_{i_t^{\ast}}^{(t+1)} = \mu_{i_t^{\ast}}^{(t)} + \alpha_{i_t^{\ast}}^{(t)}\left(x_t - \mu_{i_t^{\ast}}^{(t)}\right).$$

Equivalently, it can be written as

$$\mu_{i_t^{\ast}}^{(t+1)} = \frac{n_{i_t^{\ast}}^{(t)} \mu_{i_t^{\ast}}^{(t)} + x_t}{n_{i_t^{\ast}}^{(t)} + 1}.$$


This update:

- is exact for centroids;
- has cost $O(p)$ per observation;
- does not require storing previous observations.

---



## A.9 Pseudocode

### Algorithm 1. General architecture of CORT

**Input:** stream $D = \{x_1,\dots,x_N\}$, number of clusters $k$, target cardinalities $E$  
**Output:** cluster labels for each observation

```text
Initialize centroids, counts, residual capacities, and online mean

for t = 1, ..., N do

    if no cluster has been founded then
        select the empty cluster with the largest target capacity
        found that cluster with x_t
        continue

    calculate distances to the active clusters
    obtain delta_t and lambda_t

    calculate the best assignment cost using Algorithm 2

    if empty clusters exist then
        calculate the best foundation cost using Algorithm 3
    if not
        set the foundation cost to infinity

    if the best foundation cost is lower than the best assignment cost then
        found a new cluster
    if not
        assign x_t to the best active cluster
        update the representative using Algorithm 4

    update the online mean of minimum distances

end for
```

### Algorithm 2. Assignment evaluation

**Input:** observation $x_t$, active set $\mathcal{A}_t$, scale $\lambda_t$  
**Output:** best active cluster $i_t^*$ and minimum assignment cost

```text
for each i in A_t do
    calculate d_i(x_t)
    calculate phi_cap(i,t)
    calculate phi_load(i,t)
    calculate A_i(t) = d_i(x_t) + lambda_t [phi_cap(i,t) + phi_load(i,t)]
end for

return
    i_t^* = argmin_{i in A_t} A_i(t)
    min_{i in A_t} A_i(t)
```

### Algorithm 3. Foundation evaluation

**Input:** observation $x_t$, empty set $\mathcal{V}_t$, scale $\lambda_t$  
**Output:** best empty cluster $j_t^*$ and minimum foundation cost

```text
for each j in V_t do
    calculate phi_open(t)
    calculate phi_cap(j,t)
    calculate u_j(t)
    calculate F_j(t) = -u_j(t) + lambda_t [phi_open(t) + phi_cap(j,t)]
end for

return
    j_t^* = argmin_{j in V_t} F_j(t)
    min_{j in V_t} F_j(t)
```

### Algorithm 4. Representative update

**Input:** observation $x_t$, assigned cluster $i_t^*$  
**Output:** updated centroid

```text
calculate alpha_i = 1 / (1 + n_i)
update mu_i <- mu_i + alpha_i (x_t - mu_i)
increment cluster count
reduce residual capacity by one unit
```
