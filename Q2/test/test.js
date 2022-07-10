const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { groth16, plonk } = require("snarkjs");

const wasm_tester = require("circom_tester").wasm;

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);

describe("HelloWorld", function () {
    this.timeout(100000000);
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("HelloWorldVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Circuit should multiply two numbers correctly", async function () {
        const circuit = await wasm_tester("contracts/circuits/HelloWorld.circom");

        const INPUT = {
            "a": 2,
            "b": 3
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        //console.log(witness);

        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(6)));

    });

    it("Should return true for correct proof", async function () {
        //[assignment] Add comments to explain what each line is doing
        //This line of code retrieves the proof and the public signals associated to some inputs, the circuit and the keys.
        const { proof, publicSignals } = await groth16.fullProve({"a":"2","b":"3"}, "contracts/circuits/HelloWorld/HelloWorld_js/HelloWorld.wasm","contracts/circuits/HelloWorld/circuit_final.zkey");

        //This line of code logs the retrieved output signal, which equals the multiplication a*b.
        console.log('2x3 =',publicSignals[0]);
        
        //This line gets the necesarry data to verify the proof. 
        const calldata = await groth16.exportSolidityCallData(proof, publicSignals);

        //This line creates an array with every value retrieved in the previous line by splitting the string with the help of a regular expresion.
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());

        //The following lines format the proof and expected result for the verification by contract.
        //This line assigns the first and second values as a pair to the constant a.
        const a = [argv[0], argv[1]];
        //This line assigns the third, fourth, fifth and sixth values as a pair of pairs to the constant b.
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        //This line assigns the seventh and eighth values as a pair to the constant c.
        const c = [argv[6], argv[7]];
        //This line assigns the last value to the constant a.
        const Input = argv.slice(8);

        //This line tests that the proof is correct by calling the verifyProof function from the verifier contract. It uses the data retrieved in the previous lines as inputs for the contract.
        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with Groth16", function () {

    beforeEach(async function () {
        //[assignment] insert your script here
        Verifier = await ethers.getContractFactory("Multiplier3Verifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Circuit should multiply three numbers correctly", async function () {
        //[assignment] insert your script here
        const circuit = await wasm_tester("contracts/circuits/Multiplier3.circom");

        const INPUT = {
            "a": 3,
            "b": 5,
            "c": 7
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(105)));
    });

    it("Should return true for correct proof", async function () {
        //[assignment] insert your script here
        const { proof, publicSignals } = await groth16.fullProve({"a":"3","b":"5","c":"7"}, "contracts/circuits/Multiplier3/Multiplier3_js/Multiplier3.wasm","contracts/circuits/Multiplier3/circuit_final.zkey");

        //console.log('3x5x7 =',publicSignals[0]);

        const calldata = await groth16.exportSolidityCallData(proof, publicSignals);
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        const Input = argv.slice(8);

        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });

    it("Should return false for invalid proof", async function () {
        //[assignment] insert your script here
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with PLONK", function () {

    beforeEach(async function () {
        //[assignment] insert your script here
        Verifier = await ethers.getContractFactory("PlonkVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] insert your script here
        const { proof, publicSignals } = await plonk.fullProve({"a":"3","b":"5","c":"7"}, "contracts/circuits/Multiplier3_plonk/Multiplier3_js/Multiplier3.wasm","contracts/circuits/Multiplier3_plonk/circuit_0000.zkey");

        //console.log('3x5x7 =',publicSignals[0]);
        const calldata = await plonk.exportSolidityCallData(proof, publicSignals);
        
        const argv = calldata.replace(/["[\]\s]/g, "").split(',');

        //padding zeros to the left of the hex string until 1600 characters
        const contractProof = "0x" + "0".repeat(1600-BigInt(argv[0]).toString(16).length) + BigInt(argv[0]).toString(16);
        const contractInput = [BigInt(argv[1]).toString()];

        expect(await verifier.verifyProof(contractProof, contractInput)).to.be.true;
    });
    
    it("Should return false for invalid proof", async function () {
        //[assignment] insert your script here
        let a = "0x" + "0".repeat(1600);
        let b = [[0]];
        expect(await verifier.verifyProof(a, b)).to.be.false;
    });
});