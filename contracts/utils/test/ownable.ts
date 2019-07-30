import { chaiSetup, constants, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { OwnableRevertErrors } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';

import { artifacts, TestOwnableContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Ownable', () => {
    let ownable: TestOwnableContract;
    let owner: string;
    let nonOwner: string;

    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = await accounts[0];
        nonOwner = await accounts[1];
        await blockchainLifecycle.startAsync();
        // Deploy SafeMath from the owner address
        txDefaults.from = owner;
        ownable = await TestOwnableContract.deployFrom0xArtifactAsync(artifacts.TestOwnable, provider, txDefaults);
    });

    after(async () => {
        await blockchainLifecycle.revertAsync();
    });

    // tslint:disable:no-unused-expression
    describe('onlyOwner', () => {
        it('should throw if sender is not owner', async () => {
            const expectedError = new OwnableRevertErrors.OnlyOwnerError(nonOwner, owner);
            return expect(ownable.externalOnlyOwner.callAsync({ from: nonOwner })).to.revertWith(expectedError);
        });

        it('should succeed if sender is owner', async () => {
            return expect(ownable.externalOnlyOwner.callAsync({ from: owner })).to.be.fulfilled('');
        });
    });

    describe('transferOwnership', () => {
        it('should not transfer ownership if the specified new owner is the zero address', async () => {
            await expect(ownable.transferOwnership.sendTransactionAsync(constants.NULL_ADDRESS, { from: owner })).to.be.fulfilled('');
            const updatedOwner = await ownable.owner.callAsync();
            expect(updatedOwner).to.be.eq(owner);
        });

        it('should transfer ownership if the specified new owner is not the zero address', async () => {
            expect(ownable.transferOwnership.sendTransactionAsync(nonOwner, { from: owner })).to.be.fulfilled;
            const updatedOwner = await ownable.owner.callAsync();
            expect(updatedOwner).to.be.eq(nonOwner);
        });
    });
    // tslint:enable:no-unused-expression
});
