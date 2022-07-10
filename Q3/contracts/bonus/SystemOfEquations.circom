pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/comparators.circom";
// hint: you can use more than one templates in circomlib-matrix to help you
//Importing matrix multiplication component for further usage.
include "../../node_modules/circomlib-matrix/circuits/matMul.circom";

template SystemOfEquations(n) { // n is the number of variables in the system of equations
    signal input x[n]; // this is the solution to the system of equations
    signal input A[n][n]; // this is the coefficient matrix
    signal input b[n]; // this are the constants in the system of equations
    signal output out; // 1 for correct solution, 0 for incorrect solution

    // [bonus] insert your code here
    
    //The solution would need to multiply matrix A with matrix x and check if every element is the same as in matrix b.
    
    //Here I instantiate a matrix multiplication component. As any matrix multiplication, it needs to be [m][n]x[n][p], and in this case it is [3][3]x[3][1].
    //Instead of fixating 3 I use n for making the solution more generalized. This can be used for a system of linear equations involving more unknowns and equations.
    component mul = matMul(n,n,1);

    //Input the variables into the mul component.
    for (var i=0; i<n; i++) {
        //Inputing the solution of the system of equations into the mul component.
        mul.b[i][0] <== x[i];
        //Inputing the coefficients into the mul component. 
        for (var j=0; j<n; j++) {
            mul.a[i][j] <== A[i][j];
        }
    }

    //Declaration of a variable to count coincidence of elements. Also use it as output.
    var count = 0;

    //Compare every element in the same position from matrix b with the output of the multiplication of matrices A and x.
    for (var k=0; k<n; k++) {
        if(b[k] == mul.out[k][0]) {
        //If there is any coincidence I increment the count variable.
            count++;
        }
    }

    //If the number of coincidences equals the number comparisons that means that the solution is right.
    if(count == n) {
        //If so, I convert the count variable to 1 and use it as output.
        count = 1;
    } else {
        //If not, then something in the solution is wrong, and the output must be 0
        count = 0;
    }

    out <-- count;
}

component main {public [A, b]} = SystemOfEquations(3);