const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { groth16, plonk } = require("snarkjs");

const wasm_tester = require("circom_tester").wasm;

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);

describe("RangeProof", function () {
    this.timeout(100000000);
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("RangeProofVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Circuit should return 0 because input is less than lower bound.", async function () {
        const circuit = await wasm_tester("contracts/circuits/RangeProof.circom");

        const INPUT = {
            "in": 5,
            "range": [100, 1000]
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(0)));
    });

    it("Circuit should return 0 because input is more than upper bound.", async function () {
        const circuit = await wasm_tester("contracts/circuits/RangeProof.circom");

        const INPUT = {
            "in": 1325,
            "range": [100, 1000]
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(0)));
    });

    it("Circuit should return 1 because input between lower and upper bounds.", async function () {
        const circuit = await wasm_tester("contracts/circuits/RangeProof.circom");

        const INPUT = {
            "in": 783,
            "range": [100, 1000]
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(1)));
    });

    it("Should return true for correct proof", async function () {

        const { proof, publicSignals } = await groth16.fullProve({"in":"5","range":["100","1000"]}, "contracts/circuits/RangeProof/RangeProof_js/RangeProof.wasm","contracts/circuits/RangeProof/circuit_final.zkey");

        console.log('100 <= 5 <= 1000? =',publicSignals[0]);
        
        const calldata = await groth16.exportSolidityCallData(proof, publicSignals);

        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());

        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        const Input = argv.slice(8);

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