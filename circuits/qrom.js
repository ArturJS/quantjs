function generateQROMCircuit()
{
    //empty previous existing gate list
    gateList = [];

    var txtField = document.getElementById("circuit");
    txtField.value = "";
    /*
     Prepare the indices for the wires
     */

    var lIndices = new Array();
    var repIndices = new Array();
    var qubIndices = new Array();
    var controlIndex = toolParameters.nrLogQubits;

    for(var i=0; i<toolParameters.nrLogQubits; i++)
    {
        /*reversed order e.g. ... 2, 1, 0*/
        lIndices[i] = fromQubitNrToOrderNr(i, toolParameters.nrLogQubits);;
        repIndices[i] = toolParameters.nrLogQubits + 1 + fromQubitNrToOrderNr(i, toolParameters.nrLogQubits);
    }
    //add control as repIndices of nrLogQubits, because this one is used
    //for a CNOT
    repIndices[toolParameters.nrLogQubits] = controlIndex;

    for(var i=0; i<toolParameters.nrQubits; i++)
    {
        qubIndices[i] = 2 * toolParameters.nrLogQubits + 1 + i;
    }

    writeFileHeader(toolParameters.nrVars);

    //make iterative instead of recursive
    //to simplify output to gate list

    for(var gateIndex = 0; gateIndex < toolParameters.nrQubits; gateIndex++)
    {
        //maximum number of C-Y is gateIndex
        var binaryRep = binary(gateIndex, toolParameters.nrLogQubits);
        echo ("#------ " + binaryRep);

        //CNOT //primul 1 // target pe index, si control pe index - 1
        var idx = firstRightToLeftWithValue(1, binaryRep);
        if(idx != -1)
        {
            if(idx != binaryRep.length)
            {
                //modify idx to represent
                idx = fromOrderNrToQubitNr(idx, toolParameters.nrLogQubits);

                var delayCX = 0;
                if(toolParameters.decomposeCliffordT && idx > 0)
                    delayCX = 0;
                placeCX(repIndices[idx + 1], [repIndices[idx]], delayCX);
            }
        }

        //K gates // pana la primul 1
        var kLocs = allRightToLeftWithValue(0, binaryRep);
        kLocs.reverse();
        // X lIndices[idx]
        // K lIndices[idx] controlIndex repIndices[index]
        for(var kIndex in kLocs)
        {
            var nkIndex = fromOrderNrToQubitNr(kLocs[kIndex], toolParameters.nrLogQubits);

            var ka = lIndices[nkIndex];
            var kb = repIndices[nkIndex + 1];
            var kt = repIndices[nkIndex];

            var whichDecomposition = toolParameters.decomposeCliffordT ? 1 : 0;
            placeK(ka, kb, kt, whichDecomposition, -1/*delay*/);
        }

        //new circuit - place CX
        //this is where the CX are placed
        //their shape depends on the index of the gates

        var cxtargets2 = [];
        var cxcontrol = repIndices[0];
        for(var cxi = gateIndex; cxi < toolParameters.nrQubits; cxi++)
            cxtargets2.push(qubIndices[cxi]);
        placeGate("h", [ qubIndices[gateIndex] ], -1);
        placeCX(cxcontrol, cxtargets2);

        //U gates // pana la primul 0
        var uLocs = allRightToLeftWithValue(1, 	binaryRep);
        // U lIndices[idx] controlIndex repIndices[index]
        for(var kIndex in uLocs)
        {
            var nkIndex = fromOrderNrToQubitNr(uLocs[kIndex], toolParameters.nrLogQubits);
            var ka = lIndices[nkIndex];
            var kb = repIndices[nkIndex + 1];
            var kt = repIndices[nkIndex];

            var localDelay = -1;
            if(nkIndex == 0)
                localDelay = 0;
            placeU (ka, kb, kt, toolParameters.decomposeCliffordT ? 1 : 0, localDelay);
        }
    }
}